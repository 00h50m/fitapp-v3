import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Save, Loader2, AlertCircle, RefreshCw,
  User, Calendar, Dumbbell, FileText,
  Clock, Shield, ShieldOff, Trophy, Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SEL = "w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function accessStatus(access_end, is_active) {
  if (!is_active) return { label: "Inativo", variant: "secondary" };
  if (!access_end) return { label: "Sem plano", variant: "secondary" };
  const diff = Math.ceil((new Date(access_end + "T23:59") - new Date()) / 86400000);
  if (diff < 0)  return { label: "Expirado", variant: "destructive" };
  if (diff <= 7) return { label: `Expira em ${diff}d`, variant: "warning" };
  return { label: "Ativo", variant: "success" };
}

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const InfoChip = ({ icon: Icon, label, value, color = "default" }) => {
  const colors = {
    default: "bg-muted/60 border-border text-foreground",
    green:   "bg-green-500/10 border-green-500/20 text-green-400",
    blue:    "bg-blue-500/10 border-blue-500/20 text-blue-400",
    orange:  "bg-orange-500/10 border-orange-500/20 text-orange-400",
    red:     "bg-red-500/10 border-red-500/20 text-red-400",
    primary: "bg-primary/10 border-primary/20 text-primary",
  };
  return (
    <div className={cn("rounded-xl border p-3 flex items-center gap-2.5", colors[color])}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className="text-sm font-semibold leading-none truncate">{value || "—"}</p>
      </div>
    </div>
  );
};

const AdminAlunoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [form, setForm]         = useState(null);
  const [changed, setChanged]   = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      let { data: p } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (!p) {
        const { data: p2 } = await supabase.from("profiles").select("*").eq("user_id", id).maybeSingle();
        if (!p2) throw new Error("Aluno não encontrado. ID: " + id);
        p = p2;
      }
      const studentId = p.user_id || p.id;
      const [wr, sr] = await Promise.all([
        supabase.from("student_workouts").select("id, title, status, start_date, end_date, created_at").eq("student_id", studentId).order("created_at", { ascending: false }),
        supabase.from("workout_sessions").select("id, workout_id, session_date, finished, status, finished_at").eq("student_id", studentId).order("session_date", { ascending: false }).limit(50),
      ]);
      setProfile(p);
      setForm({
        name: p.name || "", email: p.email || "", phone: p.phone || "",
        birth_date: p.birth_date || "", gender: p.gender || "", goal: p.goal || "",
        height_cm: p.height_cm || "", weight_kg: p.weight_kg || "", plan: p.plan || "",
        training_level: p.training_level || "", access_start: p.access_start || "",
        access_end: p.access_end || "", injuries: p.injuries || "",
        emergency_contact: p.emergency_contact || "", notes: p.notes || "",
        is_active: p.is_active !== false, id: p.id, user_id: p.user_id, role: p.role,
      });
      setWorkouts(wr.data || []);
      setSessions(sr.data || []);
      setChanged(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) load(); }, [id]); // eslint-disable-line

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setChanged(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error: err } = await supabase.from("profiles").update({
        name: form.name?.trim() || null, phone: form.phone || null,
        birth_date: form.birth_date || null, gender: form.gender || null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        goal: form.goal || null, training_level: form.training_level || null,
        plan: form.plan || null, access_start: form.access_start || null,
        access_end: form.access_end || null, injuries: form.injuries || null,
        emergency_contact: form.emergency_contact || null, notes: form.notes || null,
      }).eq("id", profile.id);
      if (err) throw err;
      setProfile({ ...profile, ...form });
      setChanged(false);
      toast.success("Aluno salvo com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    const newVal = !form.is_active;
    try {
      const { error: err } = await supabase.from("profiles").update({ is_active: newVal }).eq("id", profile.id);
      if (err) throw err;
      setForm(prev => ({ ...prev, is_active: newVal }));
      setProfile(prev => ({ ...prev, is_active: newVal }));
      toast.success(newVal ? "Aluno reativado!" : "Aluno inativado!");
    } catch (err) {
      toast.error("Erro: " + err.message);
    }
  };

  const handleDelete = async () => {
    if (!profile) return;
    setDeleting(true);
    try {
      const studentId = profile.user_id || profile.id;
      await supabase.from("student_workouts").delete().eq("student_id", studentId);
      await supabase.from("workout_sessions").delete().eq("student_id", studentId);
      await supabase.from("profiles").delete().eq("id", profile.id);
      toast.success("Aluno excluído com sucesso!");
      navigate("/admin/alunos");
    } catch (err) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AdminLayout>;
  if (error) return <AdminLayout><div className="py-16 text-center"><AlertCircle className="h-8 w-8 mx-auto text-destructive mb-3" /><p className="text-destructive mb-4">{error}</p><Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Tentar novamente</Button></div></AdminLayout>;
  if (!form) return null;

  const status    = accessStatus(form.access_end, form.is_active);
  const activeWkt = workouts.filter(w => w.status === "active").length;
  const doneSess  = sessions.filter(s => s.finished).length;
  const lastSess  = sessions.find(s => s.finished);

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in max-w-3xl mx-auto pb-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin/alunos")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">{form.name || form.email?.split("@")[0] || "Aluno"}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                <span className="text-xs text-muted-foreground">{form.email}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-3.5 w-3.5" />Excluir
            </Button>
            <Button variant="outline" size="sm"
              className={cn("gap-1.5 text-xs", form.is_active ? "text-destructive border-destructive/30 hover:bg-destructive/10" : "text-green-400 border-green-400/30 hover:bg-green-400/10")}
              onClick={toggleActive}>
              {form.is_active ? <><ShieldOff className="h-3.5 w-3.5" />Inativar</> : <><Shield className="h-3.5 w-3.5" />Reativar</>}
            </Button>
            <Button variant="premium" size="sm" className="gap-1.5" onClick={handleSave} disabled={saving || !changed}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Salvar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <InfoChip icon={Dumbbell} label="Treinos ativos" value={activeWkt} color="primary" />
          <InfoChip icon={Trophy} label="Sessões concluídas" value={doneSess} color="green" />
          <InfoChip icon={Calendar} label="Plano até" value={form.access_end ? new Date(form.access_end + "T12:00").toLocaleDateString("pt-BR") : "—"} color={status.variant === "destructive" ? "red" : "blue"} />
          <InfoChip icon={Clock} label="Último treino" value={lastSess ? new Date(lastSess.session_date + "T12:00").toLocaleDateString("pt-BR") : "Nunca"} color="orange" />
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4 text-primary" />Dados Pessoais</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome completo *"><Input value={form.name || ""} onChange={e => handleChange("name", e.target.value)} /></Field>
            <Field label="Email (não editável)"><Input value={form.email || ""} disabled className="opacity-50" /></Field>
            <Field label="Telefone"><Input value={form.phone || ""} onChange={e => handleChange("phone", e.target.value)} /></Field>
            <Field label="Data de Nascimento"><Input type="date" value={form.birth_date || ""} onChange={e => handleChange("birth_date", e.target.value)} /></Field>
            <Field label="Gênero">
              <select className={SEL} value={form.gender || ""} onChange={e => handleChange("gender", e.target.value)}>
                <option value="">Selecione</option><option>Masculino</option><option>Feminino</option><option>Prefiro não dizer</option>
              </select>
            </Field>
            <Field label="Objetivo">
              <select className={SEL} value={form.goal || ""} onChange={e => handleChange("goal", e.target.value)}>
                <option value="">Selecione</option><option>Emagrecimento</option><option>Hipertrofia</option><option>Condicionamento</option><option>Reabilitação</option><option>Saúde geral</option><option>Performance</option><option>Outro</option>
              </select>
            </Field>
            <Field label="Altura (cm)"><Input type="number" value={form.height_cm || ""} onChange={e => handleChange("height_cm", e.target.value)} /></Field>
            <Field label="Peso (kg)"><Input type="number" step="0.1" value={form.weight_kg || ""} onChange={e => handleChange("weight_kg", e.target.value)} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Plano & Acesso</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Plano">
              <select className={SEL} value={form.plan || ""} onChange={e => handleChange("plan", e.target.value)}>
                <option value="">Selecione</option><option value="basic">Basic</option><option value="premium">Premium</option><option value="vip">VIP</option>
              </select>
            </Field>
            <Field label="Nível de Treino">
              <select className={SEL} value={form.training_level || ""} onChange={e => handleChange("training_level", e.target.value)}>
                <option value="">Selecione</option><option value="beginner">Iniciante</option><option value="intermediate">Intermediário</option><option value="advanced">Avançado</option>
              </select>
            </Field>
            <Field label="Início do Plano"><Input type="date" value={form.access_start || ""} onChange={e => handleChange("access_start", e.target.value)} /></Field>
            <Field label="Fim do Plano"><Input type="date" value={form.access_end || ""} onChange={e => handleChange("access_end", e.target.value)} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Saúde & Observações</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Lesões"><Input value={form.injuries || ""} onChange={e => handleChange("injuries", e.target.value)} placeholder="Ex: joelho direito, lombar..." /></Field>
            <Field label="Contato de Emergência"><Input value={form.emergency_contact || ""} onChange={e => handleChange("emergency_contact", e.target.value)} /></Field>
            <Field label="Observações">
              <textarea className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={3} value={form.notes || ""} onChange={e => handleChange("notes", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        {workouts.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Dumbbell className="h-4 w-4 text-primary" />Treinos ({workouts.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {workouts.map(w => {
                  const done = sessions.filter(s => s.workout_id === w.id && s.finished).length;
                  return (
                    <div key={w.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground truncate">{w.title}</p>
                          <Badge variant={w.status === "active" ? "success" : "secondary"} className="text-[10px]">{w.status === "active" ? "Ativo" : "Inativo"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {w.end_date ? `até ${new Date(w.end_date + "T12:00").toLocaleDateString("pt-BR")}` : "Sem validade"}{" · "}{done} sessão{done !== 1 ? "ões" : ""} concluída{done !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Button variant="premium" className="w-full gap-2" onClick={handleSave} disabled={saving || !changed}>
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</> : <><Save className="h-4 w-4" />Salvar Alterações</>}
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{form?.name || form?.email}</strong>? Todos os treinos e sessões serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminAlunoDetailPage;
