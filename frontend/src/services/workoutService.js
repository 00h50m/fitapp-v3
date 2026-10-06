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

export async function deleteWorkoutTemplate(id) {
  // Soft delete
  const { error } = await supabase
    .from("workout_templates")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

