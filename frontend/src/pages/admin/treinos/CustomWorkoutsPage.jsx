import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  UserCog, Search, Plus, MoreHorizontal, Edit, Trash2,
  Calendar, User, ClipboardList, CheckCircle2, XCircle,
  Clock, Loader2, RefreshCw, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AssignWorkoutModal from "@/components/treinos/AssignWorkoutModal";
import { getStudentWorkouts, deleteStudentWorkout } from "@/services/studentWorkoutService";

// Status real baseado em end_date (não confia no campo status do banco)
function getRealStatus(w) {
  if (!w.end_date) return "active";
  const end = new Date(w.end_date + "T23:59:59");
  if (end < new Date()) return "expired";
  return "active";
}

const statusConfig = {
  active:   { label: "Ativo",    variant: "success",     icon: CheckCircle2, color: "text-green-600 dark:text-green-400" },
  expired:  { label: "Expirado", variant: "destructive", icon: XCircle,      color: "text-destructive" },
  inactive: { label: "Inativo",  variant: "secondary",   icon: Clock,        color: "text-muted-foreground" },
};

function fmtDate(val) {
  if (!val) return "—";
  const d = new Date((val + "").split("T")[0] + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

const TABS = ["Todos", "Ativos", "Expirados", "Inativos"];

const CustomWorkoutsPage = () => {
  const [workouts,      setWorkouts]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [search,        setSearch]        = useState("");
  const [tab,           setTab]           = useState("Todos");
  const [showModal,     setShowModal]     = useState(false);
  const [editing,       setEditing]       = useState(null);
  const [deleting,      setDeleting]      = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await getStudentWorkouts();
      setWorkouts(data);
    } catch (err) {
      setError(err.message);
      toast.error("Erro ao carregar treinos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Contadores por status real
  const counts = {
    Todos:     workouts.length,
    Ativos:    workouts.filter(w => getRealStatus(w) === "active").length,
    Expirados: workouts.filter(w => getRealStatus(w) === "expired").length,
    Inativos:  workouts.filter(w => w.status === "inactive").length,
  };

  // Filtra por aba + busca
  const filtered = workouts.filter(w => {
    const rs = getRealStatus(w);
    const tabMatch =
      tab === "Todos"     ? true :
      tab === "Ativos"    ? rs === "active" && w.status !== "inactive" :
      tab === "Expirados" ? rs === "expired" :
      tab === "Inativos"  ? w.status === "inactive" :
      true;

    const q = search.toLowerCase();
    const searchMatch = !q ||
      (w.student_name || "").toLowerCase().includes(q) ||
      (w.workout_name || "").toLowerCase().includes(q);

    return tabMatch && searchMatch;
  });

  const handleSave = (saved) => {
    if (editing) {
      setWorkouts(prev => prev.map(w => w.id === saved.id ? { ...w, ...saved } : w));
    } else {
      setWorkouts(prev => [saved, ...prev.map(w =>
        w.student_id === saved.student_id && getRealStatus(w) === "active" && w.status !== "inactive"
          ? { ...w, status: "inactive" } : w
      )]);
    }
    setEditing(null);
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteStudentWorkout(deleting.id);
      setWorkouts(prev => prev.filter(w => w.id !== deleting.id));
      toast.success("Treino excluído!");
    } catch (err) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setDeleting(null);
      setConfirmDelete(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
              <UserCog className="h-6 w-6 text-primary" />
              Treinos Personalizados
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Treinos atribuídos a alunos específicos</p>
          </div>
          <Button variant="premium" className="gap-2 w-full sm:w-auto"
            onClick={() => { setEditing(null); setShowModal(true); }}>
            <Plus className="h-4 w-4" />Criar Treino Personalizado
          </Button>
        </div>

        {/* Stats clicáveis */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",    value: counts.Todos,     color: "text-foreground",  tab: "Todos" },
            { label: "Ativos",   value: counts.Ativos,    color: "text-green-600 dark:text-green-400",   tab: "Ativos" },
            { label: "Expirados",value: counts.Expirados, color: "text-destructive", tab: "Expirados" },
          ].map(s => (
            <Card key={s.tab} className="bg-card border-border cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setTab(s.tab)}>
              <CardContent className="p-4 text-center">
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabela */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <CardTitle className="text-base font-display">Treinos Atribuídos</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por aluno ou treino..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-muted border-border h-9 text-sm" />
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={load}>
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              </div>
            </div>

            {/* Abas */}
            <div className="flex gap-1 border-b border-border -mx-6 px-6 overflow-x-auto">
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}>
                  {t}
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                    tab === t ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                    {counts[t]}
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
                <Button variant="outline" size="sm" onClick={load}>Tentar novamente</Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <UserCog className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum treino encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Treino</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Aluno</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Início</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Fim</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filtered.map(w => {
                      const rs = getRealStatus(w);
                      const st = w.status === "inactive" ? "inactive" : rs;
                      const cfg = statusConfig[st] || statusConfig.active;
                      const Icon = cfg.icon;
                      return (
                        <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                <ClipboardList className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium text-sm text-foreground">{w.workout_name || "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <span className="text-sm text-foreground">{w.student_name || "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />{fmtDate(w.start_date)}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className={cn("text-sm flex items-center gap-1.5",
                              rs === "expired" ? "text-destructive font-medium" : "text-muted-foreground")}>
                              <Calendar className="h-3.5 w-3.5" />{fmtDate(w.end_date)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={cfg.variant} className="gap-1 text-xs">
                              <Icon className="h-3 w-3" />{cfg.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border">
                                <DropdownMenuItem className="gap-2 cursor-pointer"
                                  onClick={() => { setEditing(w); setShowModal(true); }}>
                                  <Edit className="h-4 w-4" />Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                  onClick={() => { setDeleting(w); setConfirmDelete(true); }}>
                                  <Trash2 className="h-4 w-4" />Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AssignWorkoutModal
        isOpen={showModal}
        workout={editing}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSave={handleSave}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleting?.workout_name}" de {deleting?.student_name}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default CustomWorkoutsPage;