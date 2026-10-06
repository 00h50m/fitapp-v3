import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MobileContainer, MobileHeader, MobileContent } from "@/components/layout/MobileContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Loader2, Trophy, Flame, Target, Calendar } from "lucide-react";

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekStreak(finishedDates) {
  if (!finishedDates.length) return 0;
  const weeks = new Set(finishedDates.map(d => startOfWeek(d).getTime()));
  let streak = 0;
  let cursor = startOfWeek(new Date());
  while (weeks.has(cursor.getTime())) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

const StudentEvolutionPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [workoutTitles, setWorkoutTitles] = useState({});

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 180);
      const { data: sData } = await supabase
        .from("workout_sessions")
        .select("id, workout_id, session_date, finished")
        .eq("student_id", user.id)
        .gte("session_date", since.toISOString().split("T")[0])
        .order("session_date", { ascending: false });
      setSessions(sData || []);

      const workoutIds = [...new Set((sData || []).map(s => s.workout_id).filter(Boolean))];
      if (workoutIds.length) {
        const { data: wData } = await supabase.from("student_workouts").select("id, title").in("id", workoutIds);
        const map = {};
        (wData || []).forEach(w => { map[w.id] = w.title; });
        setWorkoutTitles(map);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const finished = sessions.filter(s => s.finished);
  const now = new Date();
  const treinosMes = finished.filter(s => {
    const d = new Date(s.session_date + "T12:00");
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const sequencia = weekStreak(finished.map(s => new Date(s.session_date + "T12:00")));
  const taxaConclusao = sessions.length ? Math.round((finished.length / sessions.length) * 100) : 0;
  const recentes = finished.slice(0, 8);

  return (
    <MobileContainer className="pb-24">
      <MobileHeader>
        <h1 className="text-xl font-semibold">Evolução</h1>
        <p className="text-xs text-muted-foreground mt-1">Sua consistência nos últimos 6 meses</p>
      </MobileHeader>

      <MobileContent>
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="font-bold">Nenhum treino registrado ainda</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">Seu histórico aparece aqui assim que você concluir o primeiro treino.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="bg-card border border-border rounded-2xl p-4 text-center">
                <p className="text-2xl font-black leading-none mb-1.5 text-primary">{treinosMes}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Treinos no mês</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 text-center">
                <p className="text-2xl font-black leading-none mb-1.5 text-primary">{sequencia}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Semanas seguidas</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 text-center">
                <p className="text-2xl font-black leading-none mb-1.5 text-primary">{taxaConclusao}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Conclusão</p>
              </div>
            </div>

            {sequencia > 0 && (
              <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 mb-5">
                <Flame className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-sm">
                  <span className="font-semibold">{sequencia} {sequencia === 1 ? "semana" : "semanas"} seguidas</span>
                  <span className="text-muted-foreground"> treinando. Continue assim!</span>
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary flex-shrink-0" />
              <p className="text-sm font-semibold text-foreground">Treinos recentes</p>
              <div className="flex-1 h-px bg-border/50" />
            </div>
            <div className="space-y-2">
              {recentes.map(s => (
                <div key={s.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{workoutTitles[s.workout_id] || "Treino"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.session_date + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </MobileContent>

      <BottomNav />
    </MobileContainer>
  );
};

export default StudentEvolutionPage;
