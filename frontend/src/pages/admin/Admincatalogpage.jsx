import React, { useState, useEffect, useCallback, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { getCategories, createCategory, deleteCategory, getJourneys, createJourney, updateJourney, deleteJourney, setJourneyWorkouts, getJourneyById } from "@/services/journeyService";
import JourneyAccessModal from "@/components/treinos/Journeyaccessmodal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Loader2, FolderOpen, BookOpen, Users, Check, Upload, X, Image } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DIFFICULTY_LABEL = {
  iniciante: { label: "Iniciante", color: "bg-green-500/15 text-green-400" },
  intermediario: { label: "Intermediário", color: "bg-yellow-500/15 text-yellow-400" },
  avancado: { label: "Avançado", color: "bg-red-500/15 text-red-400" },
};
const COVER_EMOJIS = ["⚡","🔥","💪","🏃","🌟","🎯","⚔️","🏆","🌅","🧗","🥊","🚀"];
const COVER_COLORS = ["#0F6E56","#1a1a2e","#16213e","#0f3460","#533483","#6b2d5e","#8B1A1A","#1B4332","#7B3F00","#1a1a1a"];

async function uploadCoverImage(file) {
  const ext = file.name.split(".").pop();
  const path = `covers/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("journey-covers").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("journey-covers").getPublicUrl(path);
  return data.publicUrl;
}

const JourneyModal = ({ journey, categories, templates, onClose, onSave }) => {
  const isEdit = !!journey;
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    title: journey?.title ?? "",
    description: journey?.description ?? "",
    cover_emoji: journey?.cover_emoji ?? "⚡",
    cover_color: journey?.cover_color ?? "#0F6E56",
    cover_image_url: journey?.cover_image_url ?? "",
    duration_days: journey?.duration_days ?? "",
    difficulty: journey?.difficulty ?? "intermediario",
    category_id: journey?.category_id ?? "",
  });
  const [selectedWorkouts, setSelectedWorkouts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [coverMode, setCoverMode] = useState(journey?.cover_image_url ? "image" : "emoji");

  useEffect(() => {
    if (isEdit && journey?.id) {
      setLoadingWorkouts(true);
      getJourneyById(journey.id)
        .then(data => setSelectedWorkouts((data?.journey_workouts ?? []).map(jw => jw.workout_template_id)))
        .finally(() => setLoadingWorkouts(false));
    }
  }, [isEdit, journey?.id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleWorkout = (id) => setSelectedWorkouts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter menos de 5MB"); return; }
    setUploadingImage(true);
    try {
      const url = await uploadCoverImage(file);
      set("cover_image_url", url);
      setCoverMode("image");
      toast.success("Imagem enviada!");
    } catch (err) {
      toast.error("Erro ao fazer upload: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Nome obrigatório"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration_days: form.duration_days ? Number(form.duration_days) : null,
        category_id: form.category_id || null,
        cover_image_url: coverMode === "image" ? form.cover_image_url : null,
      };
      const saved = isEdit ? await updateJourney(journey.id, payload) : await createJourney(payload);
      await setJourneyWorkouts(saved.id, selectedWorkouts);
      toast.success(isEdit ? "Jornada atualizada!" : "Jornada criada!");
      onSave(); onClose();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={() => { if (!saving) onClose(); }}>
      <DialogContent className="bg-card border-border max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar jornada" : "Nova jornada"}</DialogTitle>
          <DialogDescription>Configure a jornada e vincule os treinos.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">

          {/* Preview da capa */}
          <div
            className="h-32 rounded-xl flex items-center justify-center relative overflow-hidden cursor-pointer group"
            style={{ background: coverMode === "image" && form.cover_image_url ? "transparent" : form.cover_color }}
            onClick={() => coverMode === "emoji" && fileInputRef.current?.click()}
          >
            {coverMode === "image" && form.cover_image_url ? (
              <>
                <img src={form.cover_image_url} alt="capa" className="absolute inset-0 w-full h-full object-cover" />
                <button
                  className="absolute top-2 right-2 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={e => { e.stopPropagation(); set("cover_image_url", ""); setCoverMode("emoji"); }}
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </>
            ) : (
              <span className="text-5xl">{form.cover_emoji}</span>
            )}
          </div>

          {/* Tabs: Emoji vs Foto */}
          <div className="flex gap-2">
            <button
              onClick={() => setCoverMode("emoji")}
              className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2", coverMode === "emoji" ? "bg-primary/15 text-primary border border-primary/30" : "bg-secondary text-muted-foreground hover:text-foreground")}
            >
              😀 Emoji
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2", coverMode === "image" ? "bg-primary/15 text-primary border border-primary/30" : "bg-secondary text-muted-foreground hover:text-foreground")}
            >
              {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
              {uploadingImage ? "Enviando..." : "Foto"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* Emoji picker — só aparece no modo emoji */}
          {coverMode === "emoji" && (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Ícone</p>
                <div className="flex flex-wrap gap-2">
                  {COVER_EMOJIS.map(e => (
                    <button key={e} onClick={() => set("cover_emoji", e)} className={cn("w-9 h-9 rounded-lg text-xl transition-all", form.cover_emoji === e ? "bg-primary/20 ring-1 ring-primary" : "bg-secondary hover:bg-secondary/80")}>{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Cor de fundo</p>
                <div className="flex gap-2 flex-wrap">
                  {COVER_COLORS.map(c => (
                    <button key={c} onClick={() => set("cover_color", c)} className={cn("w-8 h-8 rounded-lg transition-all", form.cover_color === c && "ring-2 ring-primary ring-offset-2 ring-offset-card")} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-1">Nome *</p>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="ex: Definição 45 dias" className="bg-secondary border-border" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Descrição</p>
            <Input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Objetivo em uma linha" className="bg-secondary border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Duração (dias)</p>
              <Input type="number" value={form.duration_days} onChange={e => set("duration_days", e.target.value)} placeholder="ex: 45" className="bg-secondary border-border" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Dificuldade</p>
              <Select value={form.difficulty} onValueChange={v => set("difficulty", v)}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Categoria</p>
            <Select value={form.category_id} onValueChange={v => set("category_id", v)}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Treinos da jornada ({selectedWorkouts.length} selecionados)</p>
            {loadingWorkouts ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {templates.length === 0 && <p className="text-sm text-muted-foreground py-2">Nenhum template criado ainda.</p>}
                {templates.map(t => {
                  const selected = selectedWorkouts.includes(t.id);
                  const idx = selectedWorkouts.indexOf(t.id);
                  return (
                    <button key={t.id} onClick={() => toggleWorkout(t.id)} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left", selected ? "bg-primary/15 text-primary" : "bg-secondary hover:bg-secondary/80 text-foreground")}>
                      <div className={cn("w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0", selected ? "bg-primary text-primary-foreground" : "bg-border")}>{selected ? idx + 1 : ""}</div>
                      <span className="flex-1">{t.title}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar jornada"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CategoriesModal = ({ onClose, onUpdate }) => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏋️");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); const data = await getCategories(); setCategories(data); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);
  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try { await createCategory({ name: name.trim(), emoji }); setName(""); setEmoji("🏋️"); await load(); onUpdate(); }
    catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id) => {
    try { await deleteCategory(id); await load(); onUpdate(); }
    catch (err) { toast.error(err.message); }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle>Categorias</DialogTitle>
          <DialogDescription>Organize suas jornadas por categoria.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="flex gap-2">
            <Input value={emoji} onChange={e => setEmoji(e.target.value)} className="w-14 bg-secondary border-border text-center" maxLength={2} />
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome" className="flex-1 bg-secondary border-border" onKeyDown={e => e.key === "Enter" && handleCreate()} />
            <Button onClick={handleCreate} disabled={saving || !name.trim()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}</Button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {loading && <p className="text-sm text-muted-foreground py-2">Carregando...</p>}
            {!loading && categories.length === 0 && <p className="text-sm text-muted-foreground py-2">Nenhuma categoria.</p>}
            {categories.map(c => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                <span>{c.emoji}</span>
                <span className="flex-1 text-sm">{c.name}</span>
                <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const JourneyCard = ({ journey, onEdit, onDelete, onManageAccess }) => {
  const diff = DIFFICULTY_LABEL[journey.difficulty] ?? DIFFICULTY_LABEL.intermediario;
  const count = journey.journey_workouts?.[0]?.count ?? 0;
  const hasCover = !!journey.cover_image_url;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all group">
      <div className="h-28 flex items-center justify-center relative overflow-hidden" style={{ background: hasCover ? "transparent" : journey.cover_color }}>
        {hasCover ? (
          <img src={journey.cover_image_url} alt={journey.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">{journey.cover_emoji}</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-medium text-sm leading-tight">{journey.title}</h3>
          <span className={cn("text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0", diff.color)}>{diff.label}</span>
        </div>
        {journey.category && <p className="text-xs text-muted-foreground mb-2">{journey.category.emoji} {journey.category.name}</p>}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          {journey.duration_days && <span>{journey.duration_days}d</span>}
          <span>{count} treino{count !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => onManageAccess(journey)}><Users className="h-3 w-3 mr-1" /> Acessos</Button>
          <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => onEdit(journey)}><Pencil className="h-3 w-3 mr-1" /> Editar</Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => onDelete(journey.id)}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
    </div>
  );
};

const AdminCatalogPage = () => {
  const [journeys, setJourneys] = useState([]);
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [editingJourney, setEditingJourney] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [accessJourney, setAccessJourney] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [j, c, { data: t }] = await Promise.all([
        getJourneys(),
        getCategories(),
        supabase.from("workout_templates").select("id, title, is_active").eq("is_active", true).order("title"),
      ]);
      setJourneys(j); setCategories(c); setTemplates(t ?? []);
    } catch (err) { toast.error("Erro ao carregar: " + err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleDelete = async (id) => {
    if (!confirm("Arquivar esta jornada?")) return;
    try { await deleteJourney(id); toast.success("Jornada arquivada."); loadAll(); }
    catch (err) { toast.error(err.message); }
  };

  const filtered = filterCategory === "all" ? journeys : journeys.filter(j => j.category_id === filterCategory);

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium">Catálogo de jornadas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{journeys.length} jornada{journeys.length !== 1 ? "s" : ""} ativas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCatModal(true)}><FolderOpen className="h-4 w-4 mr-1.5" /> Categorias</Button>
            <Button size="sm" onClick={() => { setEditingJourney(null); setShowJourneyModal(true); }}><Plus className="h-4 w-4 mr-1.5" /> Nova jornada</Button>
          </div>
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {[{ id: "all", emoji: "", name: "Todos" }, ...categories].map(c => (
            <button key={c.id} onClick={() => setFilterCategory(c.id)} className={cn("px-3 py-1.5 rounded-full text-sm transition-all", filterCategory === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma jornada.</p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setEditingJourney(null); setShowJourneyModal(true); }}>Criar primeira jornada</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(j => <JourneyCard key={j.id} journey={j} onEdit={(j) => { setEditingJourney(j); setShowJourneyModal(true); }} onDelete={handleDelete} onManageAccess={setAccessJourney} />)}
          </div>
        )}
      </div>
      {showJourneyModal && <JourneyModal journey={editingJourney} categories={categories} templates={templates} onClose={() => setShowJourneyModal(false)} onSave={loadAll} />}
      {showCatModal && <CategoriesModal onClose={() => setShowCatModal(false)} onUpdate={loadAll} />}
      {accessJourney && <JourneyAccessModal journey={accessJourney} onClose={() => setAccessJourney(null)} />}
    </AdminLayout>
  );
};

export default AdminCatalogPage;
