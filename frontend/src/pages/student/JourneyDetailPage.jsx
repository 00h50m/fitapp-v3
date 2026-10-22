import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getJourneyById, getStudentJourneys, enrollStudentInJourney, getGrantedJourneyIds } from "@/services/journeyService";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, CheckCircle2, Loader2, Lock, MessageCircle, Play, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DIFFICULTY_LABEL } from "@/lib/difficultyLabels";
import { CoverGlyph } from "@/lib/coverIcons";
import { usePlanPermission, FEATURES } from "@/lib/planPermissions";
import { LockedFeature } from "@/components/ui/locked-feature";
import { useAppSettings } from "@/contexts/AppSettingsContext";

const ENVIRONMENT_LABEL = { casa: "🏠 Casa", academia: "🏋️ Academia", misto: "Casa e academia" };
const EQUIPMENT_LABEL = { com_equipamento: "Com equipamento", sem_equipamento: "Sem equipamento" };

function openWhatsApp(whatsapp, journeyTitle) {
  const msg = encodeURIComponent(`Olá! Tenho interesse em liberar acesso à jornada "${journeyTitle}". Poderia me ajudar?`);
  window.open(`https://wa.me/${whatsapp}?text=${msg}`, "_blank");
}

const JourneyDetailPage = () => {
  const { id: journeyId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const perm = usePlanPermission(profile);
  const { settings } = useAppSettings();

  const [journey, setJourney]               = useState(null);
  const [studentJourney, setStudentJourney] = useState(null);
  const [hasAccess, setHasAccess]           = useState(true);
  const [profileId, setProfileId]           = useState(null);
  const [loading, setLoading]               = useState(true);
  const [savedJourney, setSavedJourney]     = useState(false);
  const [savingJourney, setSavingJourney]   = useState(false);
  const [playing, setPlaying]               = useState(false);

  const load = useCallback(async () => {
    if (!user || !journeyId) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      setProfileId(profile.id);
      const [j, sjs, grantedIds] = await Promise.all([
        getJourneyById(journeyId),
        getStudentJourneys(profile.id),
        getGrantedJourneyIds(profile.id),
      ]);
      setJourney(j);
      setStudentJourney(sjs?.find(sj => sj.journey_id === journeyId) ?? null);
      setHasAccess(grantedIds.includes(journeyId));

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

  // Botão único e direto: se ainda não matriculado, matricula e já libera o
  // treino atual na mesma ação — antes eram dois passos (iniciar jornada,
  // depois caçar o treino "Próximo" na lista pra só então pré-visualizar e
  // treinar). Mesmo mecanismo do "Treinar agora" da Início/aba Treino
  // (start_journey_workout + autostart), só que acionável daqui também.
  const handlePlay = async () => {
    if (!perm.can(FEATURES.FINISH_WORKOUT)) { toast(`Disponível no plano ${perm.minTierLabelFor(FEATURES.FINISH_WORKOUT)} ou superior 🔒`); return; }
    const workoutsList = (journey.journey_workouts ?? []).sort((a, b) => a.order_index - b.order_index);
    setPlaying(true);
    try {
      let completedCount = studentJourney?.completed_workouts ?? 0;
      if (!studentJourney) {
        await enrollStudentInJourney(profileId, journeyId);
        completedCount = 0;
      }
      const current = workoutsList[completedCount] ?? workoutsList[workoutsList.length - 1];
      if (!current?.workout?.id) { toast.error("Nenhum treino disponível nessa jornada."); return; }
      const { data: newId, error } = await supabase.rpc("start_journey_workout", { p_template_id: current.workout.id });
      if (error || !newId) { toast.error("Erro ao iniciar treino"); return; }
      navigate(`/student/workout/${newId}?autostart=1`);
    } catch { toast.error("Erro ao iniciar"); }
    finally { setPlaying(false); }
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
  const currentWorkout = (workouts[completed] ?? workouts[workouts.length - 1])?.workout ?? null;

  return (
    <div className="min-h-screen bg-background pb-8 w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden" style={{ background: hasCover ? "transparent" : journey.cover_color, filter: hasAccess ? "none" : "grayscale(60%)" }}>
        {hasCover
          ? <img src={journey.cover_image_url} alt={journey.title} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: `center ${journey.cover_focal_y ?? 50}%` }} />
          : <div className="absolute inset-0 flex items-center justify-center"><CoverGlyph value={journey.cover_emoji} className="h-20 w-20 text-white/90" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        {!hasAccess && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-black/60 rounded-full p-3"><Lock className="h-6 w-6 text-white/90" /></div>
          </div>
        )}

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
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1 mb-2">
            <Zap className="h-3 w-3" />{settings.banner_title}
          </span>
          <h1 className="text-2xl font-semibold">{journey.title}</h1>
          {journey.description && <p className="text-sm text-muted-foreground mt-1">{journey.description}</p>}
        </div>

        {/* Bloqueada: sem acesso, oferece falar com o personal */}
        {!hasAccess && (
          <div className="bg-muted/60 rounded-xl p-4 text-center space-y-3">
            <p className="text-sm font-medium">Jornada bloqueada</p>
            <p className="text-xs text-muted-foreground">Fale com seu personal para liberar o acesso.</p>
            <Button className="w-full bg-green-600 hover:bg-green-500 text-white" onClick={() => openWhatsApp(settings.whatsapp, journey.title)}>
              <MessageCircle className="h-4 w-4 mr-2" />Falar com o personal
            </Button>
          </div>
        )}

        {/* CTA principal — logo abaixo do título, um botão só, sempre no
            mesmo lugar: libera a jornada (se precisar) e já entra treinando,
            sem fazer caçar o treino "Próximo" na lista pra só então
            pré-visualizar e apertar treinar de novo. */}
        {hasAccess && !isDone && currentWorkout && (
          perm.can(FEATURES.FINISH_WORKOUT) ? (
            <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3 border border-primary/20">
              {isActive && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Treino {completed + 1} de {total}</span>
                    <span className="font-semibold text-primary">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">{isActive ? "Treino atual" : "Primeiro treino"}</p>
                  <p className="font-semibold text-sm truncate">{currentWorkout.title}</p>
                </div>
              </div>
              <Button className="w-full gap-2" size="lg" onClick={handlePlay} disabled={playing}>
                {playing ? <><Loader2 className="h-4 w-4 animate-spin" />Preparando...</> : <><Play className="h-4 w-4" />Treinar agora</>}
              </Button>
            </div>
          ) : (
            <LockedFeature label="Iniciar e acompanhar jornada" requiredTierLabel={perm.minTierLabelFor(FEATURES.FINISH_WORKOUT)} />
          )
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-xl shadow-sm p-3 text-center">
            <p className="text-lg font-bold">{journey.duration_days ?? "—"}d</p>
            <p className="text-xs text-muted-foreground">Duração</p>
          </div>
          <div className="bg-card rounded-xl shadow-sm p-3 text-center">
            <p className="text-lg font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Treinos</p>
          </div>
          <div className="bg-card rounded-xl shadow-sm p-3 text-center">
            <p className={cn("text-lg font-bold", diff.color)}>{diff.label}</p>
            <p className="text-xs text-muted-foreground">Nível</p>
          </div>
        </div>
        {(journey.environment || journey.equipment) && (
          <div className="flex gap-2">
            {journey.environment && (
              <span className="flex-1 bg-card rounded-xl shadow-sm p-2.5 text-center text-xs font-medium text-muted-foreground">
                {ENVIRONMENT_LABEL[journey.environment] ?? journey.environment}
              </span>
            )}
            {journey.equipment && (
              <span className="flex-1 bg-card rounded-xl shadow-sm p-2.5 text-center text-xs font-medium text-muted-foreground">
                {EQUIPMENT_LABEL[journey.equipment] ?? journey.equipment}
              </span>
            )}
          </div>
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
                          {isDoneItem  && <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">✓ Concluído</span>}
                        </div>
                        <p className={cn("font-medium text-sm truncate", isDoneItem ? "text-green-600 dark:text-green-400" : isCurrent ? "text-foreground font-semibold" : "text-muted-foreground")}>
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
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto" />
            <p className="font-bold text-green-600 dark:text-green-400">Jornada concluída! 🏆</p>
            <p className="text-xs text-muted-foreground">Parabéns pelo comprometimento!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JourneyDetailPage;
