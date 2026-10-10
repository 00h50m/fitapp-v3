import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoverImage } from "@/components/ui/cover-image";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ClipboardList, Search, Plus, MoreHorizontal,
  Edit, Trash2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getWorkoutTemplates, deleteWorkoutTemplate } from "@/services/workoutService";
import { supabase } from "@/lib/supabase";

const ENV_LABEL = { academia: "Academia", casa: "Casa", misto: "Misto" };

const WorkoutsPage = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [exerciseCounts, setExerciseCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadWorkouts = async () => {
    setLoading(true);
    try {
      const data = await getWorkoutTemplates();
      setWorkouts(data);

      const templateIds = data.map(w => w.id);
      if (templateIds.length) {
        const { data: exRows } = await supabase
          .from("workout_template_exercises")
          .select("template_id")
          .in("template_id", templateIds);
        const counts = {};
        (exRows || []).forEach(r => { counts[r.template_id] = (counts[r.template_id] || 0) + 1; });
        setExerciseCounts(counts);
      }
    } catch (err) {
      toast.error("Erro ao carregar treinos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const filteredWorkouts = workouts.filter(w =>
    w.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteWorkoutTemplate(deleteTarget.id);
      setWorkouts(prev => prev.filter(w => w.id !== deleteTarget.id));
      toast.success("Treino excluído!");
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              Treinos padrão
            </h1>
            <p className="text-muted-foreground mt-1">Templates reutilizáveis para agilizar prescrições.</p>
          </div>
          <Button variant="premium" className="gap-2" onClick={() => navigate("/admin/treinos/editor/new")}>
            <Plus className="h-4 w-4" />Novo treino padrão
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar treino..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border h-11"
          />
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />Carregando treinos...
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{searchTerm ? "Nenhum treino encontrado" : "Nenhum treino cadastrado"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkouts.map(workout => {
              const count = exerciseCounts[workout.id] || 0;
              return (
                <div
                  key={workout.id}
                  className="bg-card rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/admin/treinos/editor/${workout.id}`)}
                >
                  <div className="relative">
                    <CoverImage
                      src={workout.cover_image_url}
                      color="hsl(var(--primary) / 0.15)"
                      className="h-32"
                      alt={workout.title}
                    />
                    {workout.environment && ENV_LABEL[workout.environment] && (
                      <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-1 rounded-full bg-black/70 text-white">
                        {ENV_LABEL[workout.environment]}
                      </span>
                    )}
                    <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/admin/treinos/editor/${workout.id}`)}>
                            <Edit className="h-4 w-4" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => setDeleteTarget(workout)}>
                            <Trash2 className="h-4 w-4" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-foreground truncate">{workout.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{count} exercício{count !== 1 ? "s" : ""}{!workout.is_active ? " · Inativo" : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default WorkoutsPage;
