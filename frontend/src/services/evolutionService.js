import { supabase } from "@/lib/supabase";

const PHOTOS_BUCKET = "progress-photos";
const SIGNED_URL_TTL = 60 * 10; // 10 minutos — bucket é privado, nunca usar getPublicUrl aqui

export async function getBodyAssessments(studentId) {
  const { data, error } = await supabase
    .from("body_assessments")
    .select("*")
    .eq("student_id", studentId)
    .order("assessed_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addBodyAssessment(studentId, createdBy, fields) {
  const { data, error } = await supabase
    .from("body_assessments")
    .insert({ student_id: studentId, created_by: createdBy, ...fields })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBodyAssessment(id) {
  const { error } = await supabase.from("body_assessments").delete().eq("id", id);
  if (error) throw error;
}

export async function getProgressPhotos(studentId) {
  const { data, error } = await supabase
    .from("progress_photos")
    .select("*")
    .eq("student_id", studentId)
    .order("taken_at", { ascending: false });
  if (error) throw error;
  const withUrls = await Promise.all((data ?? []).map(async photo => ({
    ...photo,
    signedUrl: await getSignedPhotoUrl(photo.storage_path),
  })));
  return withUrls;
}

export async function getSignedPhotoUrl(storagePath) {
  const { data, error } = await supabase.storage.from(PHOTOS_BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL);
  if (error) return null;
  return data.signedUrl;
}

export async function uploadProgressPhoto(studentId, createdBy, file, { takenAt, angle, notes } = {}) {
  const ext = file.name.split(".").pop();
  const storagePath = `${studentId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(PHOTOS_BUCKET).upload(storagePath, file);
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("progress_photos")
    .insert({
      student_id: studentId,
      created_by: createdBy,
      storage_path: storagePath,
      taken_at: takenAt || new Date().toISOString().split("T")[0],
      angle: angle || null,
      notes: notes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return { ...data, signedUrl: await getSignedPhotoUrl(storagePath) };
}

export async function deleteProgressPhoto(id, storagePath) {
  const { error } = await supabase.from("progress_photos").delete().eq("id", id);
  if (error) throw error;
  await supabase.storage.from(PHOTOS_BUCKET).remove([storagePath]);
}
