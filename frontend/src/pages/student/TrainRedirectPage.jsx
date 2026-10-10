import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MobileContainer, MobileContent } from "@/components/layout/MobileContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Loader2, Dumbbell } from "lucide-react";

const todayStr = () => new Date().toISOString().split("T")[0];
function isExpiredWorkout(w) { if (!w.end_date) return false; return new Date(w.end_date + "T23:59:59") < new Date(); }

// Mesma lógica de rodízio usada na Início (getNextWorkoutIndex em
// StudentWorkoutsPage) — mantém a aba "Treino" sempre apontando pro mesmo
// treino sugerido lá, em vez de ter outra regra.
function getNextWorkoutIndex(workouts, sessions) {
  if (!workouts.length) return 0;
  const finished = sessions.filter(s => s.finished).sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
  if (!finished.length) return 0;
  const lastIdx = workouts.findIndex(w => w.id === finished[0].workout_id);
  return lastIdx === -1 ? 0 : (lastIdx + 1) % workouts.length;
}

// Aba fixa "Treino" do menu inferior — resolve qual é o treino do dia e
// redireciona, sem exigir uma rota com :id fixo no nav.
// Sem treino atribuído diretamente: se o aluno está numa jornada ativa,
// libera o treino atual dela na hora (mesma lógica do "Começar treino" da
// pré-visualização), em vez de mandar passar por Jornadas de novo toda
// vez que quiser treinar. Retorna o id do student_workout liberado, ou null.
async function tryStartFromActiveJourney(userId) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", userId).single();
  const { data: sj } = await supabase
    .from("student_journeys")
    .select("journey_id, completed_workouts")
    .eq("student_id", profile.id).eq("status", "active")
    .order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (!sj) return null;

  const { data: journey } = await supabase
    .from("journeys")
    .select("journey_workouts(order_index, workout:workout_templates(id))")
    .eq("id", sj.journey_id).single();
  const workouts = (journey?.journey_workouts ?? []).sort((a, b) => a.order_index - b.order_index);
  const current = workouts[sj.completed_workouts] ?? workouts[workouts.length - 1];
  if (!current?.workout?.id) return null;

  const { data: newId } = await supabase.rpc("start_journey_workout", { p_template_id: current.workout.id });
  return newId ?? null;
}

const TrainRedirectPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const today = todayStr();
      const { data: workouts } = await supabase
        .from("student_workouts")
        .select("id, end_date")
        .eq("student_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: true });

      const active = (workouts || []).filter(w => !isExpiredWorkout(w));
      if (cancelled) return;

      if (!active.length) {
        const journeyWorkoutId = await tryStartFromActiveJourney(user.id).catch(() => null);
        if (cancelled) return;
        if (journeyWorkoutId) { navigate(`/student/workout/${journeyWorkoutId}`, { replace: true }); return; }
        setEmpty(true);
        return;
      }

      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("workout_id, session_date, finished")
        .eq("student_id", user.id)
        .gte("session_date", new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]);
      if (cancelled) return;

      const ongoing = (sessions || []).find(s => s.session_date === today && !s.finished);
      const targetId = ongoing?.workout_id && active.some(w => w.id === ongoing.workout_id)
        ? ongoing.workout_id
        : active[getNextWorkoutIndex(active, sessions || [])].id;

      navigate(`/student/workout/${targetId}`, { replace: true });
    })();
    return () => { cancelled = true; };
  }, [user]); // eslint-disable-line

  if (empty) {
    return (
      <MobileContainer className="pb-24">
        <MobileContent>
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-4 px-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Dumbbell className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Nenhum treino hoje</h2>
              <p className="text-sm text-muted-foreground mt-1">Veja suas jornadas para começar um programa.</p>
            </div>
            <Button onClick={() => navigate("/student/catalog")}>Ver jornadas</Button>
          </div>
        </MobileContent>
        <BottomNav />
      </MobileContainer>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default TrainRedirectPage;
