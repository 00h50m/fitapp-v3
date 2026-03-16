import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { Search, Dumbbell, Check, Video, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const muscleGroupColors = {
  chest:       "bg-red-500/15 text-red-400 border-red-500/30",
  back:        "bg-blue-500/15 text-blue-400 border-blue-500/30",
  legs:        "bg-purple-500/15 text-purple-400 border-purple-500/30",
  shoulders:   "bg-orange-500/15 text-orange-400 border-orange-500/30",
  biceps:      "bg-green-500/15 text-green-400 border-green-500/30",
  triceps:     "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  forearms:    "bg-lime-500/15 text-lime-400 border-lime-500/30",
  core:        "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  cardio:      "bg-pink-500/15 text-pink-400 border-pink-500/30",
  glutes:      "bg-rose-500/15 text-rose-400 border-rose-500/30",
  quads:       "bg-violet-500/15 text-violet-400 border-violet-500/30",
  hamstrings:  "bg-amber-500/15 text-amber-400 border-amber-500/30",
  adductors:   "bg-teal-500/15 text-teal-400 border-teal-500/30",
  calves:      "bg-sky-500/15 text-sky-400 border-sky-500/30",
  full_body:   "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
};

// Labels PT-BR para exibição
const muscleLabels = {
  chest: "Peitoral", back: "Costas", shoulders: "Ombros",
  biceps: "Bíceps", triceps: "Tríceps", forearms: "Antebraço",
  core: "Core/Abdômen", glutes: "Glúteos", quads: "Quadríceps",
  hamstrings: "Post. Coxa", adductors: "Adutores", calves: "Panturrilha",
  full_body: "Corpo Inteiro", cardio: "Cardio", legs: "Pernas",
};

const getEmbedUrl = (url) => {
  if (!url) return "";
  if (url.includes("/embed/")) return url;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : "";
};

const ExerciseSelectorModal = ({ isOpen, onClose, onSelect, selectedIds = [] }) => {
  const [exercises, setExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null); // exercise being previewed

  const loadExercises = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("id, title, default_description, video_url, muscle_group, equipment, difficulty")
        .order("title");
      if (error) throw error;
      setExercises(data || []);
    } catch (err) {
      console.error("ExerciseSelectorModal:", err);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => { loadExercises(); }, [loadExercises]);

  const filteredExercises = exercises.filter(ex =>
    (ex.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ex.muscle_group || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = () => {
    if (selectedExercise) {
      // Normalize to match expected shape (name field)
      onSelect({ ...selectedExercise, name: selectedExercise.title });
      setSelectedExercise(null);
      setSearchTerm("");
      setPreviewVideo(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedExercise(null);
    setSearchTerm("");
    setPreviewVideo(null);
    onClose();
  };

  const embedUrl = previewVideo ? getEmbedUrl(previewVideo.video_url) : "";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-lg flex flex-col gap-0 p-0" style={{ maxHeight: "85vh" }}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-xl font-display text-foreground flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Selecionar Exercício
          </DialogTitle>
          <DialogDescription>Escolha um exercício da biblioteca</DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar exercício..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted border-border"
              autoFocus
            />
          </div>
        </div>

        {/* Video preview inline */}
        {previewVideo && embedUrl && (
          <div className="px-5 pb-3">
            <div className="aspect-video rounded-lg overflow-hidden bg-muted border border-border">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={previewVideo.title}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Pré-visualização: {previewVideo.title}
            </p>
          </div>
        )}

        {/* List */}
        <ScrollArea className="px-5" style={{ height: "340px" }}>
          {loading ? (
            <div className="py-10 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Carregando exercícios...</span>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {filteredExercises.map((exercise) => {
                const isSelected = selectedExercise?.id === exercise.id;
                const isAlreadyAdded = selectedIds.includes(exercise.id);
                const isPreviewing = previewVideo?.id === exercise.id;
                const hasVideo = !!exercise.video_url;

                return (
                  <div
                    key={exercise.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/50 hover:border-primary/30",
                      isAlreadyAdded && "opacity-50 cursor-not-allowed",
                      !isAlreadyAdded && "cursor-pointer"
                    )}
                    onClick={() => !isAlreadyAdded && setSelectedExercise(exercise)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                      )}>
                        {isSelected ? <Check className="h-5 w-5" /> :
                          hasVideo ? <Video className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium truncate text-sm", isSelected ? "text-primary" : "text-foreground")}>
                          {exercise.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {exercise.muscle_group && (
                            <Badge className={cn("text-[10px] border", muscleGroupColors[exercise.muscle_group] || "bg-muted text-muted-foreground border-border")}>
                              {muscleLabels[exercise.muscle_group] || exercise.muscle_group}
                            </Badge>
                          )}
                          {isAlreadyAdded && (
                            <span className="text-[10px] text-muted-foreground">Já adicionado</span>
                          )}
                        </div>
                      </div>
                      {/* Video preview toggle */}
                      {hasVideo && !isAlreadyAdded && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-7 w-7 flex-shrink-0", isPreviewing && "text-primary")}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewVideo(isPreviewing ? null : exercise);
                          }}
                          title={isPreviewing ? "Fechar vídeo" : "Pré-visualizar vídeo"}
                        >
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredExercises.length === 0 && !loading && (
                <div className="py-8 text-center">
                  <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum exercício encontrado</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button variant="premium" onClick={handleSelect} disabled={!selectedExercise}>
            Adicionar Exercício
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseSelectorModal;