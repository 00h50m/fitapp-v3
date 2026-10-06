import { supabase } from "@/lib/supabase";

export async function getStudentWorkouts() {
  const { data, error } = await supabase
    .from("student_workouts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const studentIds = [...new Set(data.map(w => w.student_id).filter(Boolean))];
  const templateIds = [...new Set(data.map(w => w.template_id).filter(Boolean))];

  const [profilesRes, templatesRes] = await Promise.all([
    studentIds.length
      ? supabase.from("profiles").select("id, user_id, name").in("user_id", studentIds)
      : Promise.resolve({ data: [], error: null }),
    templateIds.length
      ? supabase.from("workout_templates").select("id, title").in("id", templateIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  // student_id pode ser user_id ou profiles.id — mapeia por ambos
  const profileMap = {};
  (profilesRes.data || []).forEach(p => {
    if (p.id)      profileMap[p.id]      = p.name;
    if (p.user_id) profileMap[p.user_id] = p.name;
  });
  const templateMap = Object.fromEntries((templatesRes.data || []).map(t => [t.id, t.title]));

  return data.map(w => ({
    ...w,
    student_name: profileMap[w.student_id] || "Aluno",
    workout_name: w.title || templateMap[w.template_id] || "Treino",
  }));
}

export async function deleteStudentWorkout(id) {
  const { error } = await supabase
    .from("student_workouts")
    .delete()
    .eq("id", id);

  if (error) throw error;
}