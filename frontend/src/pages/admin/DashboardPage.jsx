import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Activity, Dumbbell, Calendar, TrendingUp, TrendingDown,
  RefreshCw, Loader2, CheckCircle2, UserPlus, ArrowRight, Clock,
  AlertCircle, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fmtRelative = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "agora mesmo";
  if (m < 60) return `há ${m} min`;
  if (h < 24) return `há ${h} hora${h > 1 ? "s" : ""}`;
  if (d < 7) return `há ${d} dia${d > 1 ? "s" : ""}`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const AVATAR_COLORS = [
  "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",
  "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
  "bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30",
];
const avatarColor = (name = "") => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const initials = (name = "") => name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

const StatCard = ({ title, value, icon: Icon, trend, trendLabel, loading }) => (
  <Card className="bg-card">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{title}</p>
          {loading
            ? <div className="h-8 w-16 bg-muted/50 rounded animate-pulse" />
            : <p className="text-3xl font-bold text-foreground tabular-nums">{value ?? "—"}</p>
          }
          {trendLabel && !loading && (
            <div className={cn("flex items-center gap-1 mt-1.5 text-xs font-medium",
              trend >= 0 ? "text-primary" : "text-destructive")}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{trendLabel}</span>
            </div>
          )}
        </div>
        <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 ml-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ActivityItem = ({ name, action, time, icon: Icon, iconColor }) => (
  <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border", avatarColor(name))}>
      {initials(name)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{name}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <Icon className={cn("h-3 w-3 flex-shrink-0", iconColor)} />
        <p className="text-xs text-muted-foreground truncate">{action}</p>
      </div>
    </div>
    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{time}</span>
  </div>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const adminFirstName = (profile?.name || user?.email?.split("@")[0] || "").split(" ")[0];
  const mountedRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: null, activeStudents: null,
    totalExercises: null, workoutsThisMonth: null, workoutTrend: null,
  });
  const [activity, setActivity] = useState([]);
  const [renewals, setRenewals] = useState(null);
  const [avgWorkouts, setAvgWorkouts] = useState(null);
  const [conclusionRate, setConclusionRate] = useState(null);
  const [priorities, setPriorities] = useState([]);

  const loadDashboard = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];
      const week7ago = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];

      // Stats básicos
      const [r1, r2, r3, r4] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student").gte("access_end", today),
        supabase.from("exercises").select("*", { count: "exact", head: true }),
        supabase.from("student_workouts").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
      ]);
      if (!mountedRef.current) return;

      // Trend e sessões
      const [r5, r6, r7, r8, r9] = await Promise.all([
        supabase.from("student_workouts").select("*", { count: "exact", head: true }).gte("created_at", prevMonthStart).lt("created_at", monthStart),
        supabase.from("workout_sessions").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
        supabase.from("workout_sessions").select("*", { count: "exact", head: true }).gte("created_at", monthStart).eq("finished", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student").gte("access_end", today).lte("access_end", in7Days),
        supabase.from("workout_sessions").select("student_id").gte("session_date", week7ago),
      ]);
      if (!mountedRef.current) return;

      const totalStudents    = r1?.count ?? 0;
      const activeStudents   = r2?.count ?? 0;
      const totalExercises   = r3?.count ?? 0;
      const workoutsThisMonth = r4?.count ?? 0;
      const workoutsPrevMonth = r5?.count ?? 0;
      const sessionsTotal    = r6?.count ?? 0;
      const sessionsFinished = r7?.count ?? 0;
      const renewalsPending  = r8?.count ?? 0;
      const sessionsWeek     = r9?.data ?? [];

      const workoutTrend = workoutsPrevMonth > 0
        ? Math.round(((workoutsThisMonth - workoutsPrevMonth) / workoutsPrevMonth) * 100)
        : null;
      const rate = sessionsTotal > 0 ? Math.round((sessionsFinished / sessionsTotal) * 100) : null;
      const avgW = activeStudents > 0 && sessionsWeek.length > 0
        ? (sessionsWeek.length / activeStudents).toFixed(1)
        : "0";

      if (mountedRef.current) {
        setStats({ totalStudents, activeStudents, totalExercises, workoutsThisMonth, workoutTrend });
        setRenewals(renewalsPending);
        setConclusionRate(rate);
        setAvgWorkouts(avgW);
      }

      // Feed de atividade — busca sessions e profiles separados (sem join para evitar erro)
      const [ra, rb] = await Promise.all([
        supabase.from("workout_sessions")
          .select("id, finished_at, started_at, student_id")
          .eq("finished", true)
          .order("finished_at", { ascending: false })
          .limit(6),
        supabase.from("profiles")
          .select("id, user_id, name, created_at")
          .eq("role", "student")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
      if (!mountedRef.current) return;

      // Busca nomes dos alunos das sessions
      const sessionStudentIds = [...new Set((ra?.data || []).map(s => s.student_id))];
      let profileMap = {};
      if (sessionStudentIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, user_id, name")
          .in("user_id", sessionStudentIds);
        (profilesData || []).forEach(p => {
          profileMap[p.user_id] = p.name || p.id;
          profileMap[p.id] = p.name || p.id;
        });
      }

      const feed = [
        ...(ra?.data || []).map(s => ({
          id: `s-${s.id}`,
          name: profileMap[s.student_id] || "Aluno",
          action: "Finalizou treino",
          date: s.finished_at || s.started_at,
          icon: CheckCircle2,
          iconColor: "text-primary",
        })),
        ...(rb?.data || []).map(s => ({
          id: `u-${s.id}`,
          name: s.name || s.id?.slice(0, 8) || "Novo Aluno",
          action: "Novo cadastro",
          date: s.created_at,
          icon: UserPlus,
          iconColor: "text-blue-600 dark:text-blue-400",
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

      if (mountedRef.current) setActivity(feed);

      // "Precisa da sua atenção" — prioridades reais computadas dos dados
      // que já temos (sem inventar insight que não dá pra calcular, tipo
      // "mensagens sem resposta" do protótipo, que exigiria chat).
      const [activeProfiles, renewalProfiles] = await Promise.all([
        supabase.from("profiles").select("user_id, name").eq("role", "student").eq("is_active", true),
        supabase.from("profiles").select("name, access_end").eq("role", "student").eq("is_active", true)
          .gte("access_end", today).lte("access_end", in7Days).order("access_end", { ascending: true }).limit(3),
      ]);
      if (!mountedRef.current) return;

      const activeIds = (activeProfiles?.data || []).map(p => p.user_id).filter(Boolean);
      let noTrainItems = [];
      if (activeIds.length) {
        const { data: recentSessions } = await supabase
          .from("workout_sessions")
          .select("student_id, session_date")
          .eq("finished", true)
          .in("student_id", activeIds)
          .gte("session_date", new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0])
          .order("session_date", { ascending: false });
        if (!mountedRef.current) return;

        const lastSessionByStudent = {};
        (recentSessions || []).forEach(s => {
          if (!lastSessionByStudent[s.student_id]) lastSessionByStudent[s.student_id] = s.session_date;
        });
        const nameByUserId = Object.fromEntries((activeProfiles?.data || []).map(p => [p.user_id, p.name]));

        noTrainItems = activeIds
          .map(uid => {
            const last = lastSessionByStudent[uid];
            const days = last ? Math.floor((Date.now() - new Date(last + "T12:00").getTime()) / 86400000) : null;
            return { name: nameByUserId[uid] || "Aluno", days };
          })
          .filter(x => x.days === null || x.days >= 5)
          .sort((a, b) => (b.days ?? 999) - (a.days ?? 999))
          .slice(0, 3)
          .map(x => ({
            id: `nt-${x.name}`,
            title: x.days === null ? `${x.name} ainda não treinou` : `${x.name} está há ${x.days} dias sem treinar`,
            subtitle: "Considere enviar um acompanhamento.",
          }));
      }

      const renewalItems = (renewalProfiles?.data || []).map(p => {
        const days = Math.ceil((new Date(p.access_end + "T23:59") - Date.now()) / 86400000);
        return {
          id: `rn-${p.name}-${p.access_end}`,
          title: `Plano de ${p.name} vence em ${days}d`,
          subtitle: "Renovação pendente.",
        };
      });

      if (mountedRef.current) setPriorities([...noTrainItems, ...renewalItems].slice(0, 4));

    } catch (err) {
      console.error("Dashboard error:", err?.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadDashboard();
    return () => { mountedRef.current = false; };
  }, [loadDashboard]);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-end">
          <Button variant="ghost" size="sm" onClick={loadDashboard} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Hero — insight do dia, fiel ao protótipo do personal */}
        <div className="relative overflow-hidden rounded-2xl bg-[hsl(220,20%,6%)] p-6">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="relative max-w-lg">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">
              <Sparkles className="h-3 w-3" />{greeting()}{adminFirstName ? `, ${adminFirstName}` : ""}
            </span>
            <h1 className="text-xl font-semibold text-white leading-snug">
              {stats.activeStudents != null
                ? `Hoje você tem ${stats.activeStudents} aluno${stats.activeStudents !== 1 ? "s" : ""} ativo${stats.activeStudents !== 1 ? "s" : ""} para acompanhar.`
                : "Visão geral do seu aplicativo de treinos."}
            </h1>
            <p className="text-sm text-white/60 mt-1.5">Priorize quem está perdendo constância e deixe o catálogo trabalhar na retenção.</p>
          </div>
        </div>

        {/* Stats — 100% dados reais, sem trend mockado */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total de Alunos"   value={stats.totalStudents}   icon={Users}     loading={loading} />
          <StatCard title="Alunos Ativos"     value={stats.activeStudents}  icon={Activity}  loading={loading} />
          <StatCard title="Exercícios"         value={stats.totalExercises}  icon={Dumbbell}  loading={loading} />
          <StatCard
            title="Treinos Este Mês"
            value={stats.workoutsThisMonth}
            icon={Calendar}
            loading={loading}
            trend={stats.workoutTrend}
            trendLabel={stats.workoutTrend != null
              ? `${stats.workoutTrend >= 0 ? "+" : ""}${stats.workoutTrend}% vs. mês anterior`
              : null}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Atividade Recente */}
          <Card className="bg-card lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Activity className="h-4 w-4 text-primary" />
                  Atividade Recente
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 px-2"
                  onClick={() => navigate("/admin/alunos")}>
                  Ver alunos <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <div className="h-9 w-9 rounded-full bg-muted/50 animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-32 bg-muted/50 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-muted/50 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Clock className="h-8 w-8 opacity-30 mb-2" />
                  <p className="text-sm">Nenhuma atividade recente</p>
                </div>
              ) : (
                <div>
                  {activity.map(item => (
                    <ActivityItem key={item.id} name={item.name} action={item.action}
                      time={fmtRelative(item.date)} icon={item.icon} iconColor={item.iconColor} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Precisa da sua atenção */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <AlertCircle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                Precisa da sua atenção
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : priorities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-7 w-7 opacity-30 mb-2" />
                  <p className="text-sm">Tudo em dia por aqui</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {priorities.map(p => (
                    <div key={p.id} className="flex items-start gap-2.5 bg-orange-500/5 border border-orange-500/15 rounded-xl p-3">
                      <div className="h-6 w-6 rounded-full bg-orange-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertCircle className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight">{p.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</p>
                  {conclusionRate != null && (
                    <Badge className={cn("text-[10px] px-1.5 py-0.5 border",
                      conclusionRate >= 70
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30")}>
                      {conclusionRate >= 70 ? "Alta" : "Média"}
                    </Badge>
                  )}
                </div>
                {loading ? <div className="h-8 w-16 bg-muted/50 rounded animate-pulse mb-2" /> : (
                  <>
                    <p className="text-3xl font-bold text-foreground mb-2">
                      {conclusionRate != null ? `${conclusionRate}%` : "—"}
                    </p>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${conclusionRate ?? 0}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">sessões finalizadas este mês</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Renovações Pendentes</p>
                  {renewals > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0.5 bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                      Atenção
                    </Badge>
                  )}
                </div>
                {loading ? <div className="h-8 w-10 bg-muted/50 rounded animate-pulse" /> : (
                  <>
                    <p className="text-3xl font-bold text-foreground">{renewals ?? "0"}</p>
                    <p className="text-xs text-muted-foreground mt-1">alunos expirando em 7 dias</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Média Treinos/Semana</p>
                {loading ? <div className="h-8 w-12 bg-muted/50 rounded animate-pulse" /> : (
                  <>
                    <p className="text-3xl font-bold text-foreground">{avgWorkouts ?? "0"}</p>
                    <p className="text-xs text-muted-foreground mt-1">por aluno ativo</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Button variant="outline"
              className="w-full justify-between border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              onClick={() => navigate("/admin/alunos/novo")}>
              <span className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />Novo Aluno
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;