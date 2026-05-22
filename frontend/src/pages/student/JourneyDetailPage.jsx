import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getJourneyById, getStudentJourneys } from "@/services/journeyService";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, Loader2, CheckCircle2, Lock, Zap,
  Clock, Dumbbell, BookOpen, Play, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DIFFICULTY_LABEL = {
  iniciante:     { label: "Iniciante",     color: "text-green-400" },
  intermediario: { label: "Intermediário", color: "text-yellow-400" },
  avancado:      { label: "Avançado",      color: "text-red-400" },
};

const JourneyDetailPage = () => {
  const { id: journeyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [journey, setJourney]             = useState(null);
  const [studentJourney, setStudentJourney] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const load = useCallback(async () => {
    if (!user || !journeyId) return;
    setLoading(true);
    try {
      const [j, sjs] = await Promise.all([
        getJourneyById(journeyId),
        getStudentJourneys(user.id),
      ]);
      setJourney(j);
      setStudentJourney(sjs?.find(sj => sj.journey_id === journeyId) ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, journeyId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (error || !journey) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-destructive text-sm">{error || "Jornada não encontrada"}</p>
      <Button variant="outline" onClick={() => navigate("/student")}><ChevronLeft className="h-4 w-4 mr-1" />Voltar</Button>
    </div>
  );

  const workouts = journey.journey_workouts ?? [];
  const completed = studentJourney?.completed_workouts ?? 0;
  const total = workouts.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasCover = !!journey.cover_image_url;
  const diff = DIFFICULTY_LABEL[journey.difficulty] ?? DIFFICULTY_LABEL.intermediario;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-52 overflow-hidden" style={{ background: hasCover ? "transparent" : journey.cover_color }}>
        {hasCover
          ? <img src={journey.cover_image_url} alt={journey.title} className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 flex items-center justify-center text-8xl">{journey.cover_emoji}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Botão voltar */}
        <button
          onClick={() => navigate("/student")}
          className="absolute top-4 left-4 h-9 w-9 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Info */}
      <div className="px-4 -mt-6 relative z-10 space-y-4 pb-8">
        {/* Título */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{journey.title}</h1>
          {journey.description && <p className="text-sm text-muted-foreground mt-1">{journey.description}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold">{journey.duration_days ?? "—"}d</p>
            <p className="text-xs text-muted-foreground">Duração</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Treinos</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={cn("text-lg font-bold", diff.color)}>{diff.label}</p>
            <p className="text-xs text-muted-foreground">Nível</p>
          </div>
        </div>

        {/* Progresso */}
        {studentJourney && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" /> Seu progresso
              </span>
              <span className="font-bold text-primary">{progress}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">Treino {completed} de {total} concluído</p>
          </div>
        )}

        {/* Timeline dos treinos */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Treinos da jornada
          </h2>

          <div className="space-y-0">
            {workouts.map((jw, idx) => {
              const isDone    = idx < completed;
              const isCurrent = idx === completed;
              const isLocked  = idx > completed;
              const workout   = jw.workout;

              return (
                <div key={jw.id} className="flex gap-3">
                  {/* Linha do tempo */}
                  <div className="flex flex-col items-center">
                    {/* Círculo */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10",
                      isDone    ? "bg-green-500 border-green-500 text-white"
                      : isCurrent ? "bg-primary border-primary text-white"
                      : "bg-card border-border text-muted-foreground"
                    )}>
                      {isDone    ? <CheckCircle2 className="h-4 w-4" />
                      : isCurrent ? <Zap className="h-4 w-4" />
                      : <Lock className="h-3.5 w-3.5" />}
                    </div>
                    {/* Linha vertical */}
                    {idx < workouts.length - 1 && (
                      <div className={cn("w-0.5 flex-1 min-h-[2rem]", isDone ? "bg-green-500/40" : "bg-border")} />
                    )}
                  </div>

                  {/* Card do treino */}
                  <div
                    className={cn(
                      "flex-1 mb-3 rounded-xl border p-3 transition-all",
                      isDone    ? "bg-green-500/5 border-green-500/20"
                      : isCurrent ? "bg-primary/5 border-primary/30 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.3)]"
                      : "bg-card border-border opacity-60"
                    )}
                    onClick={() => {
                      if (!isLocked && workout?.id) {
                        navigate(`/student/workout-preview/${workout.id}`);
                      }
                    }}
                    style={{ cursor: isLocked ? "default" : "pointer" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-muted-foreground">Treino {idx + 1}</span>
                          {isCurrent && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">Agora</span>}
                          {isDone && <span className="text-[10px] text-green-400 font-medium">✓ Concluído</span>}
                        </div>
                        <p className={cn("font-medium text-sm truncate", isDone ? "text-green-400" : isCurrent ? "text-foreground" : "text-muted-foreground")}>
                          {workout?.title ?? "Treino sem nome"}
                        </p>
                      </div>
                      {!isLocked && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        {studentJourney && completed < total && (
          <Button
            className="w-full gap-2"
            onClick={() => {
              const nextWorkout = workouts[completed];
              if (nextWorkout?.workout?.id) navigate(`/student/workout-preview/${nextWorkout.workout.id}`);
            }}
          >
            <Play className="h-4 w-4" />
            {completed === 0 ? "Começar jornada" : "Próximo treino"}
          </Button>
        )}

        {studentJourney && completed >= total && (
          <div className="text-center py-4 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto" />
            <p className="font-bold text-green-400">Jornada concluída! 🏆</p>
          </div>
        )}

        {!studentJourney && (
          <Button variant="outline" className="w-full" onClick={() => navigate("/student")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        )}
      </div>
    </div>
  );
};

export default JourneyDetailPage;
