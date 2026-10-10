import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users, Plus, Search, RefreshCw, Loader2, AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PLAN_LABEL = { basic: "Basic", premium: "Premium", vip: "VIP" };

function getAccessStatus(access_end, is_active) {
  if (is_active === false) return { label: "Inativo", variant: "secondary" };
  if (!access_end) return { label: "Sem data", variant: "secondary" };
  const diff = Math.ceil((new Date(access_end + "T23:59") - new Date()) / 86400000);
  if (diff < 0) return { label: "Expirado", variant: "destructive" };
  if (diff <= 7) return { label: `Expira em ${diff}d`, variant: "warning" };
  return { label: "Ativa", variant: "success" };
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

const HUES = [0, 25, 45, 120, 200, 260, 300];
function getHue(str) {
  if (!str) return 0;
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h + str.charCodeAt(i)) % HUES.length;
  return HUES[h];
}

const STATUS_FILTERS = [
  { key: "all", label: "Todos os status" },
  { key: "active", label: "Ativos" },
  { key: "expired", label: "Expirados" },
  { key: "inactive", label: "Inativos" },
];

const AdminAlunosPage = () => {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessionInfo, setSessionInfo] = useState({}); // user_id -> { lastDate, adherence }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("profiles")
        .select("id, user_id, name, email, phone, access_end, access_start, is_active, training_level, plan, created_at, role")
        .order("created_at", { ascending: false });
      if (data) data.splice(0, data.length, ...data.filter(p => p.role !== "admin"));
      if (err) throw err;
      setAlunos(data || []);

      // Último treino + adesão (sessões finalizadas / total) dos últimos 60 dias
      const userIds = (data || []).map(p => p.user_id).filter(Boolean);
      if (userIds.length) {
        const { data: sessions } = await supabase
          .from("workout_sessions")
          .select("student_id, session_date, finished")
          .in("student_id", userIds)
          .gte("session_date", new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0])
          .order("session_date", { ascending: false });

        const info = {};
        (sessions || []).forEach(s => {
          if (!info[s.student_id]) info[s.student_id] = { lastDate: null, total: 0, finished: 0 };
          const entry = info[s.student_id];
          entry.total += 1;
          if (s.finished) {
            entry.finished += 1;
            if (!entry.lastDate) entry.lastDate = s.session_date;
          }
        });
        setSessionInfo(info);
      } else {
        setSessionInfo({});
      }
    } catch (err) {
      setError(err.message);
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byStatus = alunos.filter(a => {
    if (statusFilter === "all") return true;
    if (statusFilter === "inactive") return a.is_active === false;
    if (statusFilter === "active") {
      if (!a.is_active && a.is_active !== null) return false;
      if (!a.access_end) return false;
      return new Date(a.access_end + "T23:59") >= new Date();
    }
    if (statusFilter === "expired") {
      if (a.is_active === false) return false;
      if (!a.access_end) return false;
      return new Date(a.access_end + "T23:59") < new Date();
    }
    return true;
  });

  const filtered = byStatus.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (a.name || "").toLowerCase().includes(q) || (a.email || "").toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">Alunos</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie acesso, plano e acompanhamento.</p>
          </div>
          <Button variant="premium" className="gap-2 w-full sm:w-auto" onClick={() => navigate("/admin/alunos/novo")}>
            <Plus className="h-4 w-4" />Novo aluno
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-card border-border h-11"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-11 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {STATUS_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <Button variant="ghost" size="icon" className="h-11 w-11 flex-shrink-0" onClick={load}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="py-12 text-center px-4">
              <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-3" />
              <p className="text-sm text-destructive mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5 mr-2" />Tentar novamente</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center px-4">
              <Users className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">{search ? `Nenhum aluno encontrado para "${search}"` : "Nenhum aluno nesta categoria"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left font-medium px-4 py-3">Aluno</th>
                    <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Plano</th>
                    <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Último treino</th>
                    <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Adesão</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map(aluno => {
                    const status = getAccessStatus(aluno.access_end, aluno.is_active);
                    const initials = getInitials(aluno.name || aluno.email);
                    const hue = getHue(aluno.name || aluno.email);
                    const info = sessionInfo[aluno.user_id];
                    const adherence = info?.total ? Math.round((info.finished / info.total) * 100) : null;
                    return (
                      <tr key={aluno.id} className={cn("cursor-pointer hover:bg-muted/30 transition-colors", aluno.is_active === false && "opacity-60")}
                        onClick={() => navigate(`/admin/alunos/${aluno.id}`)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 border"
                              style={{ background: `hsl(${hue} 60% 20%)`, borderColor: `hsl(${hue} 60% 30%)`, color: `hsl(${hue} 80% 70%)` }}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{aluno.name || aluno.email?.split("@")[0] || "Sem nome"}</p>
                              <p className="text-xs text-muted-foreground truncate sm:hidden">{PLAN_LABEL[aluno.plan] || aluno.plan || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-foreground">{PLAN_LABEL[aluno.plan] || aluno.plan || "—"}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                          {info?.lastDate ? new Date(info.lastDate + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{adherence != null ? `${adherence}%` : "—"}</td>
                        <td className="px-4 py-3"><Badge variant={status.variant} className="text-[10px]">{status.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAlunosPage;
