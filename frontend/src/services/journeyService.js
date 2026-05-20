import { supabase } from "@/lib/supabase";

export const PERSONAL_WHATSAPP = "5511949997913";

export async function getCategories() {
  const { data, error } = await supabase.from("workout_categories").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function createCategory({ name, emoji = "🏋️", color = "#1D9E75" }) {
  const { data, error } = await supabase.from("workout_categories").insert({ name, emoji, color }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("workout_categories").delete().eq("id", id);
  if (error) throw error;
}

export async function getJourneys({ categoryId } = {}) {
  let query = supabase.from("journeys").select(`*, category:workout_categories(id, name, emoji, color), journey_workouts(count)`).eq("is_active", true).order("created_at", { ascending: false });
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getJourneyById(id) {
  const { data, error } = await supabase.from("journeys").select(`*, category:workout_categories(id, name, emoji, color), journey_workouts(id, order_index, workout:workout_templates(id, title))`).eq("id", id).single();
  if (error) throw error;
  if (data?.journey_workouts) data.journey_workouts.sort((a, b) => a.order_index - b.order_index);
  return data;
}

export async function createJourney({ title, description, cover_emoji = "⚡", cover_color = "#0F6E56", duration_days, difficulty = "intermediario", category_id }) {
  const { data, error } = await supabase.from("journeys").insert({ title, description, cover_emoji, cover_color, duration_days, difficulty, category_id }).select().single();
  if (error) throw error;
  return data;
}

export async function updateJourney(id, fields) {
  const { data, error } = await supabase.from("journeys").update(fields).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteJourney(id) {
  const { error } = await supabase.from("journeys").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

export async function setJourneyWorkouts(journeyId, workoutTemplateIds) {
  const { error: delErr } = await supabase.from("journey_workouts").delete().eq("journey_id", journeyId);
  if (delErr) throw delErr;
  if (!workoutTemplateIds.length) return;
  const rows = workoutTemplateIds.map((wid, i) => ({ journey_id: journeyId, workout_template_id: wid, order_index: i }));
  const { error } = await supabase.from("journey_workouts").insert(rows);
  if (error) throw error;
}

export async function getGrantedJourneyIds(studentId) {
  const { data, error } = await supabase.from("journey_access").select("journey_id").eq("student_id", studentId);
  if (error) throw error;
  return (data ?? []).map(r => r.journey_id);
}

export async function getStudentsWithAccessStatus(journeyId) {
  const [{ data: students }, { data: access }] = await Promise.all([
    supabase.from("profiles").select("id, name, email").eq("role", "student").order("name"),
    supabase.from("journey_access").select("student_id").eq("journey_id", journeyId),
  ]);
  const grantedIds = new Set((access ?? []).map(a => a.student_id));
  return (students ?? []).map(s => ({ ...s, hasAccess: grantedIds.has(s.id) }));
}

export async function grantJourneyAccess(journeyId, studentId) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: adminProfile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
  const { error } = await supabase.from("journey_access").upsert({ journey_id: journeyId, student_id: studentId, granted_by: adminProfile.id }, { onConflict: "journey_id,student_id" });
  if (error) throw error;
}

export async function revokeJourneyAccess(journeyId, studentId) {
  const { error } = await supabase.from("journey_access").delete().eq("journey_id", journeyId).eq("student_id", studentId);
  if (error) throw error;
}

export async function getStudentJourneys(studentId) {
  const { data, error } = await supabase.from("student_journeys").select(`*, journey:journeys(id, title, description, cover_emoji, cover_color, duration_days, difficulty, category:workout_categories(name, emoji), journey_workouts(count))`).eq("student_id", studentId).order("started_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function enrollStudentInJourney(studentId, journeyId) {
  const { data: existing } = await supabase.from("student_journeys").select("id").eq("student_id", studentId).eq("journey_id", journeyId).eq("status", "active").maybeSingle();
  if (existing) return existing;
  const { data, error } = await supabase.from("student_journeys").insert({ student_id: studentId, journey_id: journeyId }).select().single();
  if (error) throw error;
  return data;
}

export async function incrementJourneyProgress(studentId, journeyId) {
  const { data: sj } = await supabase.from("student_journeys").select("id, completed_workouts, journey:journeys(journey_workouts(count))").eq("student_id", studentId).eq("journey_id", journeyId).eq("status", "active").maybeSingle();
  if (!sj) return;
  const total = sj.journey?.journey_workouts?.[0]?.count ?? 0;
  const next = sj.completed_workouts + 1;
  const done = total > 0 && next >= total;
  await supabase.from("student_journeys").update({ completed_workouts: next, status: done ? "completed" : "active" }).eq("id", sj.id);
}
