import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutTemplate, Loader2, Save, Sparkles, ChevronUp, ChevronDown, Eye, EyeOff, Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDraftHomeSections, saveDraftSection, reorderDraftSections, publishHomeSections, discardHomeSectionsDraft,
} from "@/services/homeSectionsService";

const SECTION_LABEL = {
  banner: "Banner principal",
  beginner_cta: "Comece por aqui (só pra aluno novo)",
  continue_workout: "Próximo treino / continuar treino",
  frequency_stats: "Estatísticas e frequência",
  categories_shortcut: "Atalho de categorias",
  personal_program: "Meu programa personalizado",
  journeys: "Jornadas de treino",
  saved: "Salvos",
};

const AUDIENCE_LABEL = { all: "Todo mundo", new: "Aluno novo", active: "Aluno com atividade" };

const SectionRow = ({ section, onChange, onMove, isFirst, isLast }) => (
  <div className={`flex items-start gap-3 p-4 rounded-xl border ${section.enabled ? "bg-card border-border" : "bg-muted/30 border-border/50 opacity-70"}`}>
    <div className="flex flex-col gap-0.5 flex-shrink-0 pt-1">
      <button disabled={isFirst} onClick={() => onMove(-1)} className="h-6 w-6 rounded-md bg-muted flex items-center justify-center disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
      <button disabled={isLast} onClick={() => onMove(1)} className="h-6 w-6 rounded-md bg-muted flex items-center justify-center disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
    </div>
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{SECTION_LABEL[section.key] || section.key}</p>
        <button
          className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${section.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          onClick={() => onChange({ enabled: !section.enabled })}
        >
          {section.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {section.enabled ? "Ativa" : "Desativada"}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input placeholder="Título (opcional)" value={section.title || ""} onChange={e => onChange({ title: e.target.value })} className="h-8 text-xs" />
        <Input placeholder="Texto complementar (opcional)" value={section.subtitle || ""} onChange={e => onChange({ subtitle: e.target.value })} className="h-8 text-xs" />
      </div>
      <div className="flex items-center gap-1.5">
        <Users className="h-3 w-3 text-muted-foreground" />
        {Object.entries(AUDIENCE_LABEL).map(([val, label]) => (
          <button
            key={val}
            onClick={() => onChange({ audience: val })}
            className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${section.audience === val ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const HomeEditorPage = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setSections(await getDraftHomeSections()); }
    catch (err) { toast.error("Erro ao carregar: " + err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateSection = (id, fields) => setSections(prev => prev.map(s => s.id === id ? { ...s, ...fields } : s));

  const move = (idx, dir) => {
    setSections(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await Promise.all(sections.map(s => saveDraftSection(s.id, { title: s.title, subtitle: s.subtitle, enabled: s.enabled, audience: s.audience })));
      await reorderDraftSections(sections.map(s => s.id));
      toast.success("Rascunho salvo!");
    } catch (err) { toast.error("Erro ao salvar: " + err.message); }
    finally { setSaving(false); }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await handleSaveDraft();
      await publishHomeSections();
      toast.success("Página inicial publicada!");
    } catch (err) { toast.error("Erro ao publicar: " + err.message); }
    finally { setPublishing(false); }
  };

  const handleDiscard = async () => {
    try { setSections(await discardHomeSectionsDraft()); toast("Rascunho descartado."); }
    catch (err) { toast.error("Erro: " + err.message); }
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in max-w-3xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
              <LayoutTemplate className="h-6 w-6 text-primary" />Página inicial
            </h1>
            <p className="text-muted-foreground mt-1">Ative, reordene e edite as seções que o aluno vê ao abrir o app.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleDiscard}>Descartar</Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSaveDraft} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Salvar rascunho
            </Button>
            <Button variant="premium" size="sm" className="gap-1.5" onClick={handlePublish} disabled={publishing}>
              {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}Publicar
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 space-y-2.5">
            {sections.map((section, idx) => (
              <SectionRow
                key={section.id}
                section={section}
                onChange={fields => updateSection(section.id, fields)}
                onMove={dir => move(idx, dir)}
                isFirst={idx === 0}
                isLast={idx === sections.length - 1}
              />
            ))}
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          "Público" filtra a seção: Todo mundo (sempre aparece), Aluno novo (sem treino/jornada ativa ainda) ou Aluno com atividade (já tem algo em andamento).
        </p>
      </div>
    </AdminLayout>
  );
};

export default HomeEditorPage;
