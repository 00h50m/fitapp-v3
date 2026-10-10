import { supabase } from "@/lib/supabase";

// Upload de capa compartilhado entre jornadas e treinos padrão — mesmo
// bucket (journey-covers), path prefixado por pasta pra não colidir.
export async function uploadCoverImage(file, folder = "covers") {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("journey-covers").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("journey-covers").getPublicUrl(path);
  return data.publicUrl;
}
