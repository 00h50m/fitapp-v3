import { supabase } from "@/lib/supabase";

export const CONTEXT_LABEL = {
  geral: "Geral",
  casa: "Casa",
  academia: "Academia",
  emagrecimento: "Emagrecimento",
  hipertrofia: "Ganho de massa",
  mobilidade: "Mobilidade",
  condicionamento: "Condicionamento",
  retorno: "Retorno aos treinos",
};

// Alunos só veem os ativos (RLS já filtra, mas pedimos explícito aqui também).
export async function getBeginnerContents() {
  const { data, error } = await supabase.from("beginner_contents").select("*").eq("enabled", true).order("order_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Admin vê tudo, ativo ou não, pra poder gerenciar.
export async function getAllBeginnerContents() {
  const { data, error } = await supabase.from("beginner_contents").select("*").order("order_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createBeginnerContent(fields) {
  const { data, error } = await supabase.from("beginner_contents").insert(fields).select().single();
  if (error) throw error;
  return data;
}

export async function updateBeginnerContent(id, fields) {
  const { data, error } = await supabase.from("beginner_contents").update(fields).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBeginnerContent(id) {
  const { error } = await supabase.from("beginner_contents").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderBeginnerContents(orderedIds) {
  await Promise.all(orderedIds.map((id, idx) => supabase.from("beginner_contents").update({ order_index: idx }).eq("id", id)));
}
