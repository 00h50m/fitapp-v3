import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getJourneyById, getStudentJourneys, enrollStudentInJourney } from "@/services/journeyService";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, CheckCircle2, Clock, Loader2, Lock, Play, Zap } from "lucide-react";
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

  const [journey, setJourney]               = useState(null);
  const [studentJourney, setStudentJourney] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [savedJourney, setSavedJourney]     = useState(false);
  const [savingJourney, setSavingJourney]   = useState(false);
  const [enrolling, setEnrolling]           = useState(false);

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

      // Verifica se jornada está salva
      const { data: sv } = await supabase
        .from("saved_journeys").select("id").eq("student_id", user.id).eq("journey_id", journeyId).maybeSingle();
      setSavedJourney(!!sv);
    } catch (err) {
      toast.error("Erro ao carregar jornada");
    } finally {
      setLoading(false);
    }
  }, [user, journeyId]);

  useEffect(() => { load(); }, [load]);

  const handleSaveJourney = async () => {
    setSavingJourney(true);
    try {
      if (savedJourney) {
        await supabase.from("saved_journeys").delete().eq("student_id", user.id).eq("journey_id", journeyId);
        setSavedJourney(false);
        toast.success("Removido dos salvos");
      } else {
        await supabase.from("saved_journeys").insert({ student_id: user.id, journey_id: journeyId });
        setSavedJourney(true);
        toast.success("Jornada salva! 🔖");
      }
    } catch { toast.error("Erro ao salvar"); }
    finally { setSavingJourney(false); }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enrollStudentInJourney(user.id, journeyId);
      toast.success("Jornada iniciada! 🚀");
      await load();
    } catch { toast.error("Erro ao iniciar jornada"); }
    finally { setEnrolling(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!journey) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-muted-foreground text-sm">Jornada não encontrada</p>
      <Button variant="outline" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4 mr-1" />Voltar</Button>
    </div>
  );

  const workouts = (journey.journey_workouts ?? []).sort((a, b) => a.order_index - b.order_index);
  const completed = studentJourney?.completed_workouts ?? 0;
  const total = workouts.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasCover = !!journey.cover_image_url;
  const diff = DIFFICULTY_LABEL[journey.difficulty] ?? DIFFICULTY_LABEL.intermediario;
  const isActive = studentJourney?.status === "active";
  const isDone = studentJourney?.status === "completed";

  return (
    <div className="min-h-screen bg-background pb-8 max-w-md mx-auto">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden" style={{ background: hasCover ? "transparent" : journey.cover_color }}>
        {hasCover
          ? <img src={journey.cover_image_url} alt={journey.title} className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 flex items-center justify-center text-8xl">{journey.cover_emoji}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {/* Header buttons */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="h-9 w-9 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleSaveJourney}
            disabled={savingJourney}
            className={cn("h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all", savedJourney ? "bg-primary text-white" : "bg-black/50 text-white")}
          >
            {savingJourney ? <Loader2 className="h-4 w-4 animate-spin" /> : savedJourney ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10 space-y-5">
        {/* Título */}
        <div>
          <h1 className="text-2xl font-bold">{journey.title}</h1>
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
        {isActive && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" />Seu progresso</span>
              <span className="font-bold text-primary">{progress}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">Treino {completed} de {total} concluído</p>
          </div>
        )}

        {/* CTA iniciar se não iniciou */}
        {!studentJourney && (
          <Button className="w-full gap-2" onClick={handleEnroll} disabled={enrolling}>
            {enrolling ? <><Loader2 className="h-4 w-4 animate-spin" />Iniciando...</> : <><Play className="h-4 w-4" />Iniciar jornada</>}
          </Button>
        )}

        {/* Lista de treinos */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            Treinos da jornada
            <span className="text-xs text-muted-foreground font-normal">({total} no total)</span>
          </h2>

          <div className="space-y-0">
            {workouts.map((jw, idx) => {
              const workout = jw.workout;
              const isDoneItem   = idx < completed;
              const isCurrent = idx === completed && isActive;
              const isLocked  = !studentJourney || idx > completed;

              return (
                <div key={jw.id} className="flex gap-3">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10 mt-3",
                      isDoneItem  ? "bg-green-500 border-green-500 text-white"
                      : isCurrent ? "bg-primary border-primary text-white"
                      : "bg-card border-border text-muted-foreground"
                    )}>
                      {isDoneItem  ? <CheckCircle2 className="h-4 w-4" />
                      : isCurrent ? <Zap className="h-3.5 w-3.5" />
                      : <span className="text-xs font-bold">{idx + 1}</span>}
                    </div>
                    {idx < workouts.length - 1 && (
                      <div className={cn("w-0.5 flex-1 min-h-[1rem]", isDoneItem ? "bg-green-500/40" : "bg-border")} />
                    )}
                  </div>

                  {/* Card */}
                  <div
                    className={cn(
                      "flex-1 my-2 rounded-xl border p-3 transition-all",
                      isDoneItem  ? "bg-green-500/5 border-green-500/20"
                      : isCurrent ? "bg-primary/5 border-primary/30"
                      : isLocked  ? "bg-card border-border opacity-50"
                      : "bg-card border-border hover:border-primary/30 cursor-pointer"
                    )}
                    onClick={() => {
                      if (!isLocked && workout?.id) navigate(`/student/workout-preview/${workout.id}`);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-muted-foreground">Treino {idx + 1}</span>
                          {isCurrent && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">Próximo</span>}
                          {isDoneItem  && <span className="text-[10px] text-green-400 font-medium">✓ Concluído</span>}
                        </div>
                        <p className={cn("font-medium text-sm truncate", isDoneItem ? "text-green-400" : isCurrent ? "text-foreground font-semibold" : "text-muted-foreground")}>
                          {workout?.title ?? "Treino"}
                        </p>
                      </div>
                      {!isLocked && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />}
                      {isLocked && !isDoneItem && <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-2" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isDone && (
          <div className="text-center py-4 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto" />
            <p className="font-bold text-green-400">Jornada concluída! 🏆</p>
            <p className="text-xs text-muted-foreground">Parabéns pelo comprometimento!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JourneyDetailPage;
