import { supabase } from "@/lib/supabase";

const SETTINGS_ID = true; // singleton — um personal só, hoje

export async function getPublishedSettings() {
  const { data, error } = await supabase.from("app_settings").select("*").eq("id", SETTINGS_ID).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDraftSettings() {
  const { data, error } = await supabase.from("app_settings_drafts").select("*").eq("id", SETTINGS_ID).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveDraft(fields) {
  const { data, error } = await supabase.from("app_settings_drafts").update(fields).eq("id", SETTINGS_ID).select().single();
  if (error) throw error;
  return data;
}

export async function publishDraft() {
  const draft = await getDraftSettings();
  if (!draft) throw new Error("Rascunho não encontrado");
  // eslint-disable-next-line no-unused-vars
  const { id, updated_at, ...fields } = draft;
  const { data, error } = await supabase.from("app_settings").update(fields).eq("id", SETTINGS_ID).select().single();
  if (error) throw error;
  return data;
}

// Descarta o rascunho, voltando-o para o que está publicado agora.
export async function discardDraft() {
  const published = await getPublishedSettings();
  // eslint-disable-next-line no-unused-vars
  const { id, updated_at, ...fields } = published;
  const { data, error } = await supabase.from("app_settings_drafts").update(fields).eq("id", SETTINGS_ID).select().single();
  if (error) throw error;
  return data;
}

export async function uploadBrandingImage(file, folder = "misc") {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("app-branding").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("app-branding").getPublicUrl(path);
  return data.publicUrl;
}
