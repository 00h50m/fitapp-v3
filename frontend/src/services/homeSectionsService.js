import { supabase } from "@/lib/supabase";

export async function getPublishedHomeSections() {
  const { data, error } = await supabase.from("home_sections").select("*").order("order_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getDraftHomeSections() {
  const { data, error } = await supabase.from("home_sections_drafts").select("*").order("order_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function saveDraftSection(id, fields) {
  const { data, error } = await supabase.from("home_sections_drafts").update(fields).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// Persiste a ordem (order_index) de todas as seções do rascunho de uma vez.
export async function reorderDraftSections(orderedIds) {
  await Promise.all(orderedIds.map((id, idx) => supabase.from("home_sections_drafts").update({ order_index: idx }).eq("id", id)));
}

export async function publishHomeSections() {
  const { error } = await supabase.rpc("publish_home_sections");
  if (error) throw error;
}

export async function discardHomeSectionsDraft() {
  const published = await getPublishedHomeSections();
  await Promise.all(published.map(s => supabase.from("home_sections_drafts").update({
    title: s.title, subtitle: s.subtitle, enabled: s.enabled, order_index: s.order_index, audience: s.audience, config: s.config,
  }).eq("id", s.id)));
  return getDraftHomeSections();
}
