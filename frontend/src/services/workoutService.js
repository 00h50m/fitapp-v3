import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────
// Arquitetura real do banco:
//
// workout_templates           → metadados (title, description)
// workout_template_blocks     → blocos do template (template_id → workout_templates)
// workout_template_exercises  → exercícios (block_id → workout_template_blocks)
//
// student_workouts            → atribuição admin→aluno
// student_workout_blocks      → cópia dos blocos para o aluno
// student_workout_exercises   → cópia dos exercícios para o aluno
//
// v_student_workout           → view que lê student_workout_blocks + exercises
// ─────────────────────────────────────────────────────────────

// ─── TEMPLATES ────────────────────────────────────────────────

export async function getWorkoutTemplates() {
  const { data, error } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getWorkoutTemplateById(id) {
  // 1. Template
  const { data: template, error: tErr } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (tErr) throw tErr;

  // 2. Blocos
  const { data: blocks, error: bErr } = await supabase
    .from("workout_template_blocks")
    .select("*")
    .eq("template_id", id)
    .order("order_index", { ascending: true });

  if (bErr) throw bErr;

  if (!blocks?.length) return { ...template, blocks: [] };

  // 3. Exercícios de todos os blocos
  const blockIds = blocks.map(b => b.id);
  const { data: exercises, error: eErr } = await supabase
    .from("workout_template_exercises")
    .select(`*, exercises(id, title, video_url)`)
    .in("block_id", blockIds)
    .order("order_index", { ascending: true });

  if (eErr) throw eErr;

  // 4. Monta estrutura blocos + exercícios
  const blocksWithExercises = blocks.map(block => ({
    id: `block_${block.id}`,
    dbId: block.id,
    label: block.block_label || block.title || "Bloco",
    type: block.block_type || "single",
    order: block.order_index,
    notes: block.notes || "",
    exercises: (exercises || [])
      .filter(e => e.block_id === block.id)
      .map(e => ({
        exercise_id: e.exercise_id,
        name: e.exercises?.title || "Exercício",
        sets: e.sets || 3,
        reps: e.reps || "10-12",
        rest: e.rest_seconds || 60,
        tempo: e.tempo || "",
        notes: e.notes || "",
      })),
  }));

  return { ...template, blocks: blocksWithExercises };
}

// Alias para compatibilidade com WorkoutEditorPage
export const getWorkoutTemplateForEditor = getWorkoutTemplateById;

export async function saveWorkoutTemplate({ id, title, description, blocks, createdBy }) {
  const isNew = !id;
  let templateId = id;

  // 1. Cria ou atualiza o template
  if (isNew) {
    const { error: ie } = await supabase
      .from("workout_templates")
      .insert([{ title, description: description || "", is_active: true, created_by: createdBy }]);
    if (ie) throw ie;
    const { data } = await supabase
      .from("workout_templates").select("id").eq("title", title)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    templateId = data?.id;
  } else {
    const { error } = await supabase
      .from("workout_templates")
      .update({ title, description: description || "" })
      .eq("id", id);
    if (error) throw error;

    // Remove blocos e exercícios antigos para reinserir
    const { data: oldBlocks } = await supabase
      .from("workout_template_blocks")
      .select("id")
      .eq("template_id", id);

    if (oldBlocks?.length) {
      const oldBlockIds = oldBlocks.map(b => b.id);
      await supabase
        .from("workout_template_exercises")
        .delete()
        .in("block_id", oldBlockIds);
    }

    await supabase
      .from("workout_template_blocks")
      .delete()
      .eq("template_id", id);
  }

  // 2. Insere blocos e exercícios
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    const { error: bErr } = await supabase
      .from("workout_template_blocks")
      .insert([{
        template_id: templateId, block_label: block.label, title: block.label,
        block_type: block.type || "single", order_index: i + 1,
        notes: block.notes || "", rest_after_block_seconds: 60,
      }]);
    if (bErr) throw bErr;
    const { data: blockData } = await supabase
      .from("workout_template_blocks").select("id")
      .eq("template_id", templateId).eq("order_index", i + 1).maybeSingle();

    for (let j = 0; j < block.exercises.length; j++) {
      const ex = block.exercises[j];

      const { error: eErr } = await supabase
        .from("workout_template_exercises")
        .insert([{
          template_id: templateId,
          block_id: blockData.id,
          exercise_id: ex.exercise_id,
          order_index: j + 1,
          sets: ex.sets || 3,
          reps: String(ex.reps || "10-12"),
          rest_seconds: ex.rest || 60,
          tempo: ex.tempo || "",
          notes: ex.notes || "",
        }]);

      if (eErr) throw eErr;
    }
  }

  return templateId;
}

export async function deleteWorkoutTemplate(id) {
  // Soft delete
  const { error } = await supabase
    .from("workout_templates")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

// ─── CÓPIA DO TEMPLATE PARA O ALUNO ───────────────────────────

export async function copyTemplateToStudent({ studentWorkoutId, templateId }) {
  // 1. Busca blocos do template
  const { data: blocks, error: bErr } = await supabase
    .from("workout_template_blocks")
    .select("*")
    .eq("template_id", templateId)
    .order("order_index", { ascending: true });

  if (bErr) throw bErr;
  if (!blocks?.length) {
    console.warn("Template sem blocos:", templateId);
    return;
  }

  const blockIds = blocks.map(b => b.id);

  // 2. Busca exercícios de todos os blocos
  const { data: exercises, error: eErr } = await supabase
    .from("workout_template_exercises")
    .select("*")
    .in("block_id", blockIds)
    .order("order_index", { ascending: true });

  if (eErr) throw eErr;

  // 3. Copia cada bloco e seus exercícios para o aluno
  for (const block of blocks) {
    const { error: sbErr } = await supabase
      .from("student_workout_blocks")
      .insert([{
        student_workout_id: studentWorkoutId,
        source_template_block_id: block.id,
        block_label: block.block_label || block.title,
        block_type: block.block_type || "single",
        order_index: block.order_index,
        rest_after_block_seconds: block.rest_after_block_seconds || 60,
        notes: block.notes || "",
      }]);
    if (sbErr) throw sbErr;
    const { data: swBlock } = await supabase
      .from("student_workout_blocks").select("id")
      .eq("student_workout_id", studentWorkoutId)
      .eq("order_index", block.order_index).maybeSingle();

    const blockExercises = (exercises || []).filter(e => e.block_id === block.id);

    for (const ex of blockExercises) {
      const { error: seErr } = await supabase
        .from("student_workout_exercises")
        .insert([{
          student_workout_id: studentWorkoutId,
          block_id: swBlock.id,
          source_template_exercise_id: ex.id,
          exercise_id: ex.exercise_id,
          order_index: ex.order_index,
          sets: ex.sets || 3,
          reps: ex.reps || "10-12",
          rest_seconds: ex.rest_seconds || 60,
          tempo: ex.tempo || "",
          notes: ex.notes || "",
        }]);

      if (seErr) throw seErr;
    }
  }
}