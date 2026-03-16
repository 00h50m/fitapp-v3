import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Save, X, User, ClipboardList, Loader2, Edit } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";


// Normaliza data para YYYY-MM-DD independente do formato vindo do banco
const toDateInput = (val) => {
  if (!val) return "";
  // Se já é YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  // Se é ISO timestamp
  return val.split("T")[0];
};

const AssignWorkoutModal = ({ isOpen, onClose, onSave, workout = null }) => {
  const isEditMode = !!workout;

  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    student_id: "",
    template_id: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
  });

  // Popula form quando abre em modo edição
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && workout) {
      setFormData({
        student_id: workout.student_id || "",
        template_id: workout.template_id || "",
        start_date: toDateInput(workout.start_date) || new Date().toISOString().split("T")[0],
        end_date: toDateInput(workout.end_date) || "",
      });
    } else {
      setFormData({
        student_id: "",
        template_id: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
      });
    }
  }, [isOpen, workout]);

  // Carrega alunos e templates
  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [studentsRes, templatesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, name, email")
            .eq("role", "student")
            .order("name"),
          supabase
            .from("workout_templates")
            .select("id, title")
            .eq("is_active", true)
            .order("title"),
        ]);
        if (studentsRes.error) throw studentsRes.error;
        if (templatesRes.error) throw templatesRes.error;
        setStudents(studentsRes.data || []);
        setTemplates(templatesRes.data || []);
      } catch (err) {
        toast.error("Erro ao carregar dados: " + err.message);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.student_id || !formData.end_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (!isEditMode && !formData.template_id) {
      toast.error("Selecione um treino");
      return;
    }

    setSaving(true);
    try {
      const student = students.find(s => s.id === formData.student_id);

      if (isEditMode) {
        // Modo edição — só atualiza datas e status
        const { error } = await supabase
          .from("student_workouts")
          .update({
            start_date: formData.start_date,
            end_date: formData.end_date,
            status: "active",
          })
          .eq("id", workout.id);

        if (error) throw error;

        toast.success("Treino atualizado!");
        // Retorna objeto montado localmente (sem re-fetch para evitar body stream)
        onSave?.({
          ...workout,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: "active",
        });
      } else {
        // Modo criação — usa função assign_template_to_student que cria e copia tudo
        const template = templates.find(t => t.id === formData.template_id);
        const { data: session } = await supabase.auth.getSession();
        const adminId = session?.session?.user?.id;

        // Chama a RPC que cria student_workout + copia blocos e exercícios
        const { data: newWorkoutId, error: rpcErr } = await supabase.rpc(
          "assign_template_to_student",
          {
            p_template_id: formData.template_id,
            p_student_id: formData.student_id,
            p_created_by: adminId,
          }
        );
        if (rpcErr) throw rpcErr;

        // Atualiza as datas do treino criado
        if (newWorkoutId && (formData.start_date || formData.end_date)) {
          await supabase.from("student_workouts").update({
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
          }).eq("id", newWorkoutId);
        }

        toast.success(`Treino atribuído para ${student?.name}!`);
        onSave?.({
          id: newWorkoutId,
          student_id: formData.student_id,
          student_name: student?.name || "Aluno",
          workout_name: template?.title || "Treino",
          template_id: formData.template_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: "active",
        });

      }

      onClose();
    } catch (err) {
      console.error("Erro ao salvar treino:", err);
      toast.error("Erro ao salvar treino: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-foreground flex items-center gap-2">
            {isEditMode ? <Edit className="h-5 w-5 text-primary" /> : <ClipboardList className="h-5 w-5 text-primary" />}
            {isEditMode ? "Editar Treino" : "Atribuir Treino"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Editando: ${workout?.workout_name || "Treino"} — ${workout?.student_name || "Aluno"}`
              : "Atribua um template de treino a um aluno"}
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando dados...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Aluno — bloqueado no modo edição */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Aluno *
              </Label>
              {isEditMode ? (
                <div className="px-3 py-2 rounded-md bg-muted border border-border text-sm text-muted-foreground">
                  {workout?.student_name || "—"}
                </div>
              ) : (
                <Select value={formData.student_id} onValueChange={v => handleChange("student_id", v)}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Selecione um aluno..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {students.length === 0
                      ? <SelectItem value="none" disabled>Nenhum aluno cadastrado</SelectItem>
                      : students.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                            {s.email && <span className="text-muted-foreground text-xs ml-2">({s.email})</span>}
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Treino — bloqueado no modo edição */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                Treino *
              </Label>
              {isEditMode ? (
                <div className="px-3 py-2 rounded-md bg-muted border border-border text-sm text-muted-foreground">
                  {workout?.workout_name || "—"}
                </div>
              ) : (
                <Select value={formData.template_id} onValueChange={v => handleChange("template_id", v)}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Selecione um treino..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {templates.length === 0
                      ? <SelectItem value="none" disabled>Nenhum template cadastrado</SelectItem>
                      : templates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={e => handleChange("start_date", e.target.value)}
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={e => handleChange("end_date", e.target.value)}
                  className="bg-muted border-border"
                  min={formData.start_date}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="premium" disabled={saving || loadingData}>
            {saving
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
              : isEditMode
              ? <><Save className="h-4 w-4 mr-2" />Salvar Alterações</>
              : <><Save className="h-4 w-4 mr-2" />Atribuir Treino</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignWorkoutModal;