import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SEL = "w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const muscleOptions = [
  { value: "chest",        label: "Peitoral" },
  { value: "back",         label: "Costas" },
  { value: "shoulders",    label: "Ombros" },
  { value: "biceps",       label: "Bíceps" },
  { value: "triceps",      label: "Tríceps" },
  { value: "forearms",     label: "Antebraço" },
  { value: "core",         label: "Core/Abdômen" },
  { value: "glutes",       label: "Glúteos" },
  { value: "quads",        label: "Quadríceps" },
  { value: "hamstrings",   label: "Posterior de Coxa" },
  { value: "adductors",    label: "Adutores" },
  { value: "calves",       label: "Panturrilha" },
  { value: "full_body",    label: "Corpo Inteiro" },
  { value: "cardio",       label: "Cardio" },
];

const equipmentOptions = [
  { value: "barbell",      label: "Barra" },
  { value: "dumbbell",     label: "Halteres" },
  { value: "cable",        label: "Cabo/Polia" },
  { value: "machine",      label: "Máquina" },
  { value: "bodyweight",   label: "Peso Corporal" },
  { value: "kettlebell",   label: "Kettlebell" },
  { value: "band",         label: "Elástico" },
  { value: "smith",        label: "Smith" },
  { value: "trap_bar",     label: "Trap Bar" },
  { value: "bench",        label: "Banco" },
  { value: "other",        label: "Outro" },
];

const difficultyOptions = [
  { value: "beginner",     label: "Iniciante" },
  { value: "intermediate", label: "Intermediário" },
  { value: "advanced",     label: "Avançado" },
];

const categoryOptions = [
  { value: "strength",    label: "Força" },
  { value: "hypertrophy", label: "Hipertrofia" },
  { value: "endurance",   label: "Resistência" },
  { value: "power",       label: "Potência" },
  { value: "mobility",    label: "Mobilidade" },
  { value: "cardio",      label: "Cardio" },
];

const mechanicsOptions = [
  { value: "compound",    label: "Composto" },
  { value: "isolation",   label: "Isolado" },
];

const forceOptions = [
  { value: "push",         label: "Empurrar" },
  { value: "pull",         label: "Puxar" },
  { value: "legs",         label: "Pernas" },
  { value: "core",         label: "Core" },
  { value: "rotation",     label: "Rotação" },
  { value: "stabilization",label: "Estabilização" },
];

// Músculos secundários — sem Cardio
const secondaryMuscleOptions = [
  { value: "chest",        label: "Peitoral" },
  { value: "back",         label: "Costas" },
  { value: "shoulders",    label: "Ombros" },
  { value: "biceps",       label: "Bíceps" },
  { value: "triceps",      label: "Tríceps" },
  { value: "forearms",     label: "Antebraço" },
  { value: "core",         label: "Core/Abdômen" },
  { value: "glutes",       label: "Glúteos" },
  { value: "quads",        label: "Quadríceps" },
  { value: "hamstrings",   label: "Posterior de Coxa" },
  { value: "adductors",    label: "Adutores" },
  { value: "calves",       label: "Panturrilha" },
  { value: "full_body",    label: "Corpo Inteiro" },
];

const getYoutubeId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
};

const EMPTY = {
  title: "", description: "", video_url: "",
  muscle_group: "", secondary_muscles: [],
  equipment: "", difficulty: "", category: "",
  mechanics: "", force: "", instructions: "", tips: "",
};

const ExerciseFormModal = ({ isOpen, onClose, onSave, exercise }) => {
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [videoPreview, setVideoPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (exercise) {
        setForm({
          title:             exercise.title || "",
          description:       exercise.default_description || exercise.description || "",
          video_url:         exercise.video_url || "",
          muscle_group:      exercise.muscle_group || "",
          secondary_muscles: exercise.secondary_muscles || [],
          equipment:         exercise.equipment || "",
          difficulty:        exercise.difficulty || "",
          category:          exercise.category || "",
          mechanics:         exercise.mechanics || "",
          force:             exercise.force || "",
          instructions:      exercise.instructions || "",
          tips:              exercise.tips || "",
        });
      } else {
        setForm(EMPTY);
      }
      setVideoPreview(false);
    }
  }, [isOpen, exercise]);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const toggleSecondary = (val) => {
    setForm(p => ({
      ...p,
      secondary_muscles: p.secondary_muscles.includes(val)
        ? p.secondary_muscles.filter(m => m !== val)
        : [...p.secondary_muscles, val],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { return; }
    setSaving(true);
    const ok = await onSave({ ...form, id: exercise?.id });
    setSaving(false);
    if (ok !== false) onClose();
  };

  const ytId = getYoutubeId(form.video_url);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-lg font-display">
            {exercise ? "Editar Exercício" : "Novo Exercício"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

          {/* Nome */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nome do Exercício *</Label>
            <Input
              placeholder="Ex: Supino Reto com Barra"
              value={form.title}
              onChange={e => set("title", e.target.value)}
              className="bg-muted border-border"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <textarea
              className={cn(SEL, "resize-none")}
              rows={2}
              placeholder="Descreva o exercício brevemente..."
              value={form.description}
              onChange={e => set("description", e.target.value)}
            />
          </div>

          {/* URL do Vídeo */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">URL do Vídeo (YouTube)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.video_url}
                onChange={e => { set("video_url", e.target.value); setVideoPreview(false); }}
                className="bg-muted border-border flex-1"
              />
              {ytId && (
                <Button variant="outline" size="icon" onClick={() => setVideoPreview(p => !p)}>
                  <Play className="h-4 w-4" />
                </Button>
              )}
            </div>
            {videoPreview && ytId && (
              <div className="rounded-xl overflow-hidden aspect-video bg-black mt-2">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allowFullScreen
                  title="Preview"
                />
              </div>
            )}
            {ytId && !videoPreview && (
              <p className="text-xs text-primary cursor-pointer hover:underline" onClick={() => setVideoPreview(true)}>
                ▶ Pré-visualização do vídeo
              </p>
            )}
          </div>

          {/* Grupo Muscular + Equipamento + Dificuldade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Grupo Muscular</Label>
              <select className={SEL} value={form.muscle_group} onChange={e => set("muscle_group", e.target.value)}>
                <option value="">Selecione...</option>
                {muscleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Equipamento</Label>
              <select className={SEL} value={form.equipment} onChange={e => set("equipment", e.target.value)}>
                <option value="">Selecione...</option>
                {equipmentOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Dificuldade</Label>
              <select className={SEL} value={form.difficulty} onChange={e => set("difficulty", e.target.value)}>
                <option value="">Selecione...</option>
                {difficultyOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Categoria + Mecânica + Força */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <select className={SEL} value={form.category} onChange={e => set("category", e.target.value)}>
                <option value="">Selecione...</option>
                {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Mecânica</Label>
              <select className={SEL} value={form.mechanics} onChange={e => set("mechanics", e.target.value)}>
                <option value="">Selecione...</option>
                {mechanicsOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo de Força</Label>
              <select className={SEL} value={form.force} onChange={e => set("force", e.target.value)}>
                <option value="">Selecione...</option>
                {forceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Músculos Secundários */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Músculos Secundários</Label>
            <div className="flex flex-wrap gap-2">
              {secondaryMuscleOptions.map(o => {
                const selected = form.secondary_muscles.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggleSecondary(o.value)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-all",
                      selected
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-muted border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {selected && <span className="mr-1">✓</span>}
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instruções */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Como Executar (Instruções)</Label>
            <textarea
              className={cn(SEL, "resize-none")}
              rows={4}
              placeholder="Descreva o passo a passo da execução do exercício..."
              value={form.instructions}
              onChange={e => set("instructions", e.target.value)}
            />
          </div>

          {/* Dicas */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Dicas do Treinador</Label>
            <textarea
              className={cn(SEL, "resize-none")}
              rows={3}
              placeholder="Dicas para melhorar a execução, evitar erros comuns..."
              value={form.tips}
              onChange={e => set("tips", e.target.value)}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border flex-shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            <X className="h-4 w-4 mr-1.5" />Cancelar
          </Button>
          <Button variant="premium" onClick={handleSubmit} disabled={saving || !form.title.trim()}>
            {saving
              ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Salvando...</>
              : <><Save className="h-4 w-4 mr-1.5" />{exercise ? "Salvar Alterações" : "Criar Exercício"}</>
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseFormModal;