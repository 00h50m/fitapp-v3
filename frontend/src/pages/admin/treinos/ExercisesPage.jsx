import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
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
  Dumbbell, Search, Plus, MoreHorizontal,
  Edit, Trash2, Video, Loader2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import ExerciseFormModal from "@/components/treinos/ExerciseFormModal";

// Labels para exibição na tabela
const muscleLabels = {
  chest: "Peitoral", back: "Costas", shoulders: "Ombros",
  biceps: "Bíceps", triceps: "Tríceps", forearms: "Antebraço",
  core: "Core/Abdômen", glutes: "Glúteos", quads: "Quadríceps",
  hamstrings: "Post. Coxa", adductors: "Adutores", calves: "Panturrilha",
  full_body: "Corpo Inteiro", cardio: "Cardio",
  // legacy
  legs: "Pernas",
};

const equipmentLabels = {
  barbell: "Barra", dumbbell: "Halteres", cable: "Cabo/Polia",
  machine: "Máquina", bodyweight: "Peso Corporal", kettlebell: "Kettlebell",
  band: "Elástico", smith: "Smith", trap_bar: "Trap Bar", bench: "Banco", other: "Outro",
};

const difficultyLabels = {
  beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado",
};

const difficultyColors = {
  beginner: "bg-success/15 text-success border-success/30",
  intermediate: "bg-warning/15 text-warning border-warning/30",
  advanced: "bg-destructive/15 text-destructive border-destructive/30",
};
const difficultyLabel = { beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" };

const muscleGroupColors = {
  chest: "bg-red-500/15 text-red-400 border-red-500/30",
  back: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  legs: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  shoulders: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  biceps: "bg-green-500/15 text-green-400 border-green-500/30",
  triceps: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  core: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  cardio: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  glutes: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  full_body: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
};

const ExercisesPage = () => {
  const [exercises, setExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [deleteExercise, setDeleteExercise] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("title", { ascending: true });
      if (error) throw error;
      setExercises(data || []);
    } catch (err) {
      toast.error("Erro ao carregar exercícios: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadExercises(); }, [loadExercises]);

  const filteredExercises = exercises.filter(ex =>
    (ex.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ex.muscle_group || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Save: cria ou atualiza. Valida nome único no front antes de enviar.
  const handleSave = async (exerciseData) => {
    const titleNorm = (exerciseData.title || "").trim().toLowerCase();

    // Verificar duplicata (exceto o próprio ao editar)
    const duplicate = exercises.find(ex =>
      ex.title?.trim().toLowerCase() === titleNorm &&
      ex.id !== exerciseData.id
    );
    if (duplicate) {
      toast.error(`Já existe um exercício chamado "${exerciseData.title.trim()}"`);
      return false; // sinaliza erro para o modal não fechar
    }

    try {
      if (editingExercise) {
        const { error } = await supabase
          .from("exercises")
          .update({
            title: exerciseData.title.trim(),
            default_description: exerciseData.description || null,
            video_url: exerciseData.video_url || null,
            muscle_group: exerciseData.muscle_group || null,
            secondary_muscles: exerciseData.secondary_muscles?.length ? exerciseData.secondary_muscles : null,
            equipment: exerciseData.equipment || null,
            difficulty: exerciseData.difficulty || null,
            category: exerciseData.category || null,
            mechanics: exerciseData.mechanics || null,
            force: exerciseData.force || null,
            instructions: exerciseData.instructions || null,
            tips: exerciseData.tips || null,
          })
          .eq("id", editingExercise.id);
        if (error) {
          if (error.code === "23505") {
            toast.error("Já existe um exercício com esse nome");
            return false;
          }
          throw error;
        }
        toast.success("Exercício atualizado!");
      } else {
        const { error } = await supabase
          .from("exercises")
          .insert([{
            title: exerciseData.title.trim(),
            default_description: exerciseData.description || null,
            video_url: exerciseData.video_url || null,
            muscle_group: exerciseData.muscle_group || null,
            secondary_muscles: exerciseData.secondary_muscles?.length ? exerciseData.secondary_muscles : null,
            equipment: exerciseData.equipment || null,
            difficulty: exerciseData.difficulty || null,
            category: exerciseData.category || null,
            mechanics: exerciseData.mechanics || null,
            force: exerciseData.force || null,
            instructions: exerciseData.instructions || null,
            tips: exerciseData.tips || null,
            is_active: true,
          }]);
        if (error) {
          if (error.code === "23505") {
            toast.error("Já existe um exercício com esse nome");
            return false;
          }
          throw error;
        }
        toast.success("Exercício criado!");
      }
      setEditingExercise(null);
      setShowModal(false);
      loadExercises();
      return true;
    } catch (err) {
      toast.error("Erro ao salvar: " + err.message);
      return false;
    }
  };

  const handleDelete = async () => {
    if (!deleteExercise) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("exercises")
        .update({ is_active: false })
        .eq("id", deleteExercise.id);
      if (error) throw error;
      toast.success("Exercício removido");
      setDeleteExercise(null);
      loadExercises();
    } catch (err) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (exercise) => {
    setEditingExercise(exercise);
    setShowModal(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-primary" />
              Biblioteca de Exercícios
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os exercícios disponíveis para os treinos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={loadExercises} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button variant="premium" className="gap-2" onClick={() => { setEditingExercise(null); setShowModal(true); }}>
              <Plus className="h-4 w-4" />
              Novo Exercício
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: exercises.length, color: "text-foreground" },
            { label: "Com Vídeo", value: exercises.filter(e => e.video_url).length, color: "text-primary" },
            { label: "Grupos Musc.", value: new Set(exercises.map(e => e.muscle_group).filter(Boolean)).size, color: "text-foreground" },
            { label: "Equipamentos", value: new Set(exercises.map(e => e.equipment).filter(Boolean)).size, color: "text-foreground" },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg font-display">Lista de Exercícios</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar exercício..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted border-border"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-muted-foreground">Carregando...</span>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Exercício</TableHead>
                        <TableHead className="text-muted-foreground">Grupo Muscular</TableHead>
                        <TableHead className="text-muted-foreground hidden lg:table-cell">Equipamento</TableHead>
                        <TableHead className="text-muted-foreground">Dificuldade</TableHead>
                        <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExercises.map((exercise) => (
                        <TableRow key={exercise.id} className="border-border hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
                                {exercise.video_url ? <Video className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate max-w-[200px]">{exercise.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                  {exercise.default_description || exercise.description || "Sem descrição"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {exercise.muscle_group && (
                              <Badge className={cn("border text-xs", muscleGroupColors[exercise.muscle_group] || "bg-muted text-muted-foreground")}>
                                {muscleLabels[exercise.muscle_group] || exercise.muscle_group}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-sm text-foreground">{equipmentLabels[exercise.equipment] || exercise.equipment || "—"}</span>
                          </TableCell>
                          <TableCell>
                            {exercise.difficulty && (
                              <Badge className={cn("border text-xs", difficultyColors[exercise.difficulty] || "bg-muted text-muted-foreground")}>
                                {difficultyLabels[exercise.difficulty] || exercise.difficulty}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border">
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleEdit(exercise)}>
                                  <Edit className="h-4 w-4" />Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                  onClick={() => setDeleteExercise(exercise)}
                                >
                                  <Trash2 className="h-4 w-4" />Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-border">
                  {filteredExercises.map((exercise) => (
                    <div key={exercise.id} className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        {exercise.video_url ? <Video className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{exercise.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {exercise.muscle_group && (
                            <span className="text-xs text-muted-foreground">{muscleLabels[exercise.muscle_group] || exercise.muscle_group}</span>
                          )}
                          {exercise.difficulty && (
                            <Badge className={cn("border text-[10px] px-1", difficultyColors[exercise.difficulty] || "bg-muted")}>
                              {difficultyLabels[exercise.difficulty] || exercise.difficulty}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleEdit(exercise)}>
                            <Edit className="h-4 w-4" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => setDeleteExercise(exercise)}
                          >
                            <Trash2 className="h-4 w-4" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>

                {filteredExercises.length === 0 && !loading && (
                  <div className="py-12 text-center">
                    <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Nenhum exercício encontrado</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ExerciseFormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingExercise(null); }}
        exercise={editingExercise}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteExercise} onOpenChange={() => setDeleteExercise(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir exercício?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteExercise?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default ExercisesPage;