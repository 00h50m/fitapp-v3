import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users, Plus, Search, RefreshCw, Loader2,
  AlertCircle, ChevronRight, Calendar, Mail,
  CheckCircle2, Clock, UserX, ShieldOff,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function getAccessStatus(access_end, is_active) {
  if (is_active === false) return { label: "Inativo", variant: "secondary" };
  if (!access_end) return { label: "Sem data", variant: "secondary" };
  const diff = Math.ceil((new Date(access_end + "T23:59") - new Date()) / 86400000);
  if (diff < 0)  return { label: "Expirado",         variant: "destructive" };
  if (diff <= 7) return { label: `Expira em ${diff}d`, variant: "warning" };
  return { label: "Ativo", variant: "success" };
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

const TABS = [
  { key: "all",      label: "Todos" },
  { key: "active",   label: "Ativos" },
  { key: "expired",  label: "Expirados" },
  { key: "inactive", label: "Inativos" },
];

const AdminAlunosPage = () => {
  const navigate = useNavigate();
  const [alunos, setAlunos]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState("");
  const [tab, setTab]         = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Busca todos os profiles que NÃO são admin
      // Inclui role = 'student', role = null (recém criados) e is_active = false
      const { data, error: err } = await supabase
        .from("profiles")
        .select("id, user_id, name, email, phone, access_end, access_start, is_active, training_level, plan, created_at, role")
        .order("created_at", { ascending: false });
      // filtra admins no frontend para evitar problemas com .or() no PostgREST
      if (data) data.splice(0, data.length, ...data.filter(p => p.role !== "admin"));

      if (err) throw err;
      setAlunos(data || []);
    } catch (err) {
      setError(err.message);
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtra por aba
  const byTab = alunos.filter(a => {
    if (tab === "all") return true;
    if (tab === "inactive") return a.is_active === false;
    if (tab === "active") {
      if (!a.is_active && a.is_active !== null) return false;
      if (!a.access_end) return false;
      return new Date(a.access_end + "T23:59") >= new Date();
    }
    if (tab === "expired") {
      if (a.is_active === false) return false;
      if (!a.access_end) return false;
      return new Date(a.access_end + "T23:59") < new Date();
    }
    return true;
  });

  // Filtra por busca
  const filtered = byTab.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (a.name || "").toLowerCase().includes(q) || (a.email || "").toLowerCase().includes(q);
  });

  // Contadores para badges nas abas
  const counts = {
    all:      alunos.length,
    active:   alunos.filter(a => a.is_active !== false && a.access_end && new Date(a.access_end + "T23:59") >= new Date()).length,
    expired:  alunos.filter(a => a.is_active !== false && a.access_end && new Date(a.access_end + "T23:59") < new Date()).length,
    inactive: alunos.filter(a => a.is_active === false).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-semibold text-foreground">Alunos</h1>
              <p className="text-sm text-muted-foreground">Gerencie os alunos e suas sessões de treino</p>
            </div>
          </div>
          <Button variant="premium" className="gap-2 w-full sm:w-auto"
            onClick={() => navigate("/admin/alunos/novo")}>
            <Plus className="h-4 w-4" />Novo Aluno
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total",    value: counts.all,      icon: Users,        color: "primary" },
            { label: "Ativos",   value: counts.active,   icon: CheckCircle2, color: "green" },
            { label: "Expirados",value: counts.expired,  icon: Clock,        color: "orange" },
            { label: "Inativos", value: counts.inactive, icon: ShieldOff,    color: "red" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-card border-border cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setTab(label === "Total" ? "all" : label.toLowerCase())}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center border flex-shrink-0",
                    color === "primary" ? "bg-primary/10 border-primary/20" :
                    color === "green"   ? "bg-green-500/10 border-green-500/20" :
                    color === "orange"  ? "bg-orange-500/10 border-orange-500/20" :
                    "bg-red-500/10 border-red-500/20"
                  )}>
                    <Icon className={cn("h-4 w-4",
                      color === "primary" ? "text-primary" :
                      color === "green"   ? "text-green-600 dark:text-green-400" :
                      color === "orange"  ? "text-orange-600 dark:text-orange-400" :
                      "text-red-600 dark:text-red-400"
                    )} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{loading ? "—" : value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lista com abas */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <CardTitle className="text-base font-display">Lista de Alunos</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm bg-muted border-border"
                  />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={load}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Abas */}
            <div className="flex gap-1 border-b border-border -mx-6 px-6 overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    tab === t.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                    tab === t.key ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {counts[t.key]}
                  </span>
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="py-12 text-center px-4">
                <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-3" />
                <p className="text-sm text-destructive mb-3">{error}</p>
                <Button variant="outline" size="sm" onClick={load}>
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />Tentar novamente
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center px-4">
                <Users className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {search ? `Nenhum aluno encontrado para "${search}"` : "Nenhum aluno nesta categoria"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(aluno => {
                  const status   = getAccessStatus(aluno.access_end, aluno.is_active);
                  const initials = getInitials(aluno.name || aluno.email);
                  const hue      = getHue(aluno.name || aluno.email);
                  const isInactive = aluno.is_active === false;

                  return (
                    <div
                      key={aluno.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer",
                        isInactive && "opacity-60"
                      )}
                      onClick={() => navigate(`/admin/alunos/${aluno.id}`)}
                    >
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border"
                        style={{
                          background:   `hsl(${hue} 60% 20%)`,
                          borderColor:  `hsl(${hue} 60% 30%)`,
                          color:        `hsl(${hue} 80% 70%)`,
                        }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground truncate">
                            {aluno.name || aluno.email?.split("@")[0] || "Sem nome"}
                          </p>
                          <Badge variant={status.variant} className="text-[10px] flex-shrink-0">
                            {status.label}
                          </Badge>
                          {isInactive && (
                            <ShieldOff className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {aluno.email && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              {aluno.email}
                            </p>
                          )}
                          {aluno.access_end && (
                            <p className="text-xs text-muted-foreground flex-shrink-0 hidden sm:flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(aluno.access_end + "T12:00").toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAlunosPage;