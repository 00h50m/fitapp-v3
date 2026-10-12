import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MobileContainer, MobileHeader, MobileContent } from "@/components/layout/MobileContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trophy, Flame, Target, Calendar, Ruler, Camera, Plus, X, Trash2 } from "lucide-react";
import { EvolutionSkeleton } from "@/components/student/LoadingSkeletons";
import { usePlanPermission, FEATURES } from "@/lib/planPermissions";
import { LockedFeature } from "@/components/ui/locked-feature";
import {
  getBodyAssessments, addBodyAssessment, deleteBodyAssessment,
  getProgressPhotos, uploadProgressPhoto, deleteProgressPhoto,
} from "@/services/evolutionService";
import { toast } from "sonner";

const ASSESSMENT_FIELDS = [
  { key: "weight_kg", label: "Peso (kg)" },
  { key: "body_fat_pct", label: "% Gordura" },
  { key: "waist_cm", label: "Cintura (cm)" },
  { key: "chest_cm", label: "Peito (cm)" },
  { key: "hip_cm", label: "Quadril (cm)" },
  { key: "arm_cm", label: "Braço (cm)" },
  { key: "thigh_cm", label: "Coxa (cm)" },
];

const emptyAssessmentForm = () => Object.fromEntries(ASSESSMENT_FIELDS.map(f => [f.key, ""]));

// ── Medidas ────────────────────────────────────────────────────
const AssessmentsSection = ({ profileId, userId }) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAssessmentForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setAssessments(await getBodyAssessments(profileId)); }
    catch (err) { toast.error("Erro ao carregar medidas: " + err.message); }
    finally { setLoading(false); }
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    const fields = Object.fromEntries(
      ASSESSMENT_FIELDS.map(f => [f.key, form[f.key] ? Number(form[f.key]) : null]).filter(([, v]) => v !== null)
    );
    if (Object.keys(fields).length === 0) { toast("Preencha pelo menos uma medida"); return; }
    setSaving(true);
    try {
      await addBodyAssessment(profileId, profileId, fields);
      setForm(emptyAssessmentForm());
      setShowForm(false);
      await load();
      toast.success("Medida registrada!");
    } catch (err) { toast.error("Erro ao salvar: " + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteBodyAssessment(id); setAssessments(prev => prev.filter(a => a.id !== id)); }
    catch (err) { toast.error("Erro ao excluir: " + err.message); }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Ruler className="h-4 w-4 text-primary flex-shrink-0" />
        <p className="text-sm font-semibold text-foreground">Medidas</p>
        <div className="flex-1 h-px bg-border/50" />
        <button className="text-xs text-primary font-medium flex items-center gap-1" onClick={() => setShowForm(p => !p)}>
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? "Cancelar" : "Nova"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl shadow-sm p-4 mb-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {ASSESSMENT_FIELDS.map(f => (
              <div key={f.key}>
                <label className="text-[10px] text-muted-foreground">{f.label}</label>
                <Input type="number" step="0.1" value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="h-9 text-sm" />
              </div>
            ))}
          </div>
          <Button variant="premium" className="w-full" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar medida"}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : assessments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhuma medida registrada ainda.</p>
      ) : (
        <div className="space-y-2">
          {assessments.map(a => (
            <div key={a.id} className="bg-card rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-1">{new Date(a.assessed_at + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
                  {ASSESSMENT_FIELDS.filter(f => a[f.key] != null).map(f => (
                    <span key={f.key}><span className="font-semibold">{a[f.key]}</span> <span className="text-muted-foreground text-xs">{f.label.replace(/\s*\(.*\)/, "")}</span></span>
                  ))}
                </div>
              </div>
              <button className="text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => handleDelete(a.id)}><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Fotos de evolução ──────────────────────────────────────────
const PhotosSection = ({ profileId }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try { setPhotos(await getProgressPhotos(profileId)); }
    catch (err) { toast.error("Erro ao carregar fotos: " + err.message); }
    finally { setLoading(false); }
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      await uploadProgressPhoto(profileId, profileId, file);
      await load();
      toast.success("Foto adicionada!");
    } catch (err) { toast.error("Erro ao enviar foto: " + err.message); }
    finally { setUploading(false); }
  };

  const handleDelete = async (photo) => {
    try { await deleteProgressPhoto(photo.id, photo.storage_path); setPhotos(prev => prev.filter(p => p.id !== photo.id)); }
    catch (err) { toast.error("Erro ao excluir: " + err.message); }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="h-4 w-4 text-primary flex-shrink-0" />
        <p className="text-sm font-semibold text-foreground">Fotos de evolução</p>
        <div className="flex-1 h-px bg-border/50" />
        <label className="text-xs text-primary font-medium flex items-center gap-1 cursor-pointer">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Nova
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : photos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhuma foto registrada ainda. Só você e seu personal podem ver.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(p => (
            <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
              {p.signedUrl ? <img src={p.signedUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Camera className="h-5 w-5 text-muted-foreground/40" /></div>}
              <button
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(p)}
              >
                <Trash2 className="h-3 w-3" />
              </button>
              <span className="absolute bottom-1 left-1 text-[9px] text-white bg-black/60 rounded px-1">{new Date(p.taken_at + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const { user, profile } = useAuth();
  const perm = usePlanPermission(profile);
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
          <EvolutionSkeleton />
        ) : (
          <>
            {!perm.can(FEATURES.FREQUENCY_TRACKING) ? (
              <LockedFeature className="mb-6" label="Frequência e histórico de treinos" requiredTierLabel={perm.minTierLabelFor(FEATURES.FREQUENCY_TRACKING)} />
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center gap-4 py-10 mb-2">
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
                  <div className="bg-card rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-2xl font-black leading-none mb-1.5 text-primary">{treinosMes}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Treinos no mês</p>
                  </div>
                  <div className="bg-card rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-2xl font-black leading-none mb-1.5 text-primary">{sequencia}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Semanas seguidas</p>
                  </div>
                  <div className="bg-card rounded-2xl shadow-sm p-4 text-center">
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
                <div className="space-y-2 mb-6">
                  {recentes.map(s => (
                    <div key={s.id} className="flex items-center gap-3 bg-card rounded-2xl shadow-sm px-4 py-3">
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

            {/* Medidas e fotos de evolução — exclusivo Consultoria */}
            {perm.can(FEATURES.PHOTOS_MEASUREMENTS) ? (
              profile?.id && (
                <>
                  <AssessmentsSection profileId={profile.id} userId={user.id} />
                  <PhotosSection profileId={profile.id} />
                </>
              )
            ) : (
              <LockedFeature label="Fotos e medidas de evolução" requiredTierLabel={perm.minTierLabelFor(FEATURES.PHOTOS_MEASUREMENTS)} />
            )}
          </>
        )}
      </MobileContent>

      <BottomNav />
    </MobileContainer>
  );
};

export default StudentEvolutionPage;
