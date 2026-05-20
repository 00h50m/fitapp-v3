import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MobileContainer, MobileHeader, MobileContent, MobileFooter } from "@/components/layout/MobileContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User, Dumbbell, LogOut, Loader2, RefreshCw, ChevronRight,
  AlertCircle, Trophy, Calendar, Play, CheckCircle2, Lock,
  FileText, ArrowRight, Star, Clock, ChevronDown, ChevronUp,
  X, MessageCircle, Zap, BookOpen, Crown,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getJourneys, getCategories, getStudentJourneys, getGrantedJourneyIds, enrollStudentInJourney, PERSONAL_WHATSAPP } from "@/services/journeyService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Constants ──────────────────────────────────────────────────
const WA_NUMBER = "5511949997913";
const waLink = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
const todayStr = () => new Date().toISOString().split("T")[0];

const DIFFICULTY_LABEL = {
  iniciante: { label: "Iniciante", color: "text-green-400" },
  intermediario: { label: "Intermediário", color: "text-yellow-400" },
  avancado: { label: "Avançado", color: "text-red-400" },
};

function openWhatsApp(msg) {
  window.open(`https://wa.me/${PERSONAL_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
}

// ── Helpers ────────────────────────────────────────────────────
function getNextWorkoutIndex(workouts, sessions) {
  if (!workouts.length) return 0;
  const finished = sessions.filter(s => s.finished).sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
  if (!finished.length) return 0;
  const lastIdx = workouts.findIndex(w => w.id === finished[0].workout_id);
  return lastIdx === -1 ? 0 : (lastIdx + 1) % workouts.length;
}
function trainedToday(sessions) { return sessions.some(s => s.session_date === todayStr() && s.finished); }
function activeSessionToday(sessions) { return sessions.find(s => s.session_date === todayStr() && !s.finished) || null; }
function isExpiredWorkout(w) { if (!w.end_date) return false; return new Date(w.end_date + "T23:59:59") < new Date(); }

// ── Icons ──────────────────────────────────────────────────────
const WhatsAppIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ── PDF Modal ──────────────────────────────────────────────────
const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
function loadPdfJs() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const s = document.createElement("script");
    s.src = PDFJS_CDN;
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; resolve(window.pdfjsLib); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
const PdfModal = ({ url, onClose }) => {
  const canvasRef = React.useRef(null);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [pdfDoc, setPdfDoc] = React.useState(null);
  const [pdfLoading, setPdfLoading] = React.useState(true);
  const [pdfError, setPdfError] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    setPdfLoading(true); setPdfError(null);
    loadPdfJs().then(lib => lib.getDocument({ url, withCredentials: false }).promise)
      .then(doc => { if (!cancelled) { setPdfDoc(doc); setTotal(doc.numPages); setPdfLoading(false); } })
      .catch(() => { if (!cancelled) { setPdfError(true); setPdfLoading(false); } });
    return () => { cancelled = true; };
  }, [url]);
  React.useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    pdfDoc.getPage(page).then(p => {
      const vp = p.getViewport({ scale: 1.4 });
      const canvas = canvasRef.current;
      canvas.width = vp.width; canvas.height = vp.height;
      p.render({ canvasContext: canvas.getContext("2d"), viewport: vp });
    });
  }, [pdfDoc, page]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/90 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl flex flex-col overflow-hidden" style={{ height: "92dvh" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">PDF do Treino</span></div>
          <div className="flex items-center gap-3">
            {total > 1 && <div className="flex items-center gap-2 text-xs text-muted-foreground"><button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1} className="px-2 py-1 rounded bg-muted disabled:opacity-40">‹</button>{page}/{total}<button onClick={() => setPage(p => Math.min(total, p+1))} disabled={page>=total} className="px-2 py-1 rounded bg-muted disabled:opacity-40">›</button></div>}
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Abrir</a>
            <button className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center" onClick={onClose}><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-start justify-center p-3 bg-muted/20">
          {pdfLoading && <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {pdfError && <div className="flex flex-col items-center py-16 gap-3"><p className="text-sm text-muted-foreground">Não foi possível carregar o PDF.</p><a href={url} target="_blank" rel="noopener noreferrer"><button className="px-4 py-2 rounded-xl border border-border text-sm">Abrir em nova aba</button></a></div>}
          {!pdfLoading && !pdfError && <canvas ref={canvasRef} className="shadow-lg max-w-full rounded" />}
        </div>
      </div>
    </div>
  );
};

// ── Section Label ──────────────────────────────────────────────
const SectionLabel = ({ children, icon: Icon }) => (
  <div className="flex items-center gap-2 mb-3">
    {Icon && <Icon className="h-4 w-4 text-primary flex-shrink-0" />}
    <p className="text-sm font-semibold text-foreground">{children}</p>
    <div className="flex-1 h-px bg-border/50" />
  </div>
);

// ── Journey Card (Netflix style) ───────────────────────────────
const JourneyCard = ({ journey, studentJourney, hasAccess, onSelect }) => {
  const total = journey.journey_workouts?.[0]?.count ?? 0;
  const completed = studentJourney?.completed_workouts ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isActive = studentJourney?.status === "active";
  const isDone = studentJourney?.status === "completed";
  const locked = !hasAccess;
  const hasCover = !!journey.cover_image_url;

  return (
    <div className="flex-shrink-0 w-32 cursor-pointer group" onClick={() => onSelect(journey)}>
      <div className="relative h-48 rounded-xl overflow-hidden mb-2">
        <div className="absolute inset-0 flex items-center justify-center text-5xl transition-transform duration-300 group-hover:scale-105"
          style={{ background: hasCover ? "transparent" : journey.cover_color, filter: locked ? "grayscale(70%)" : "none" }}>
          {hasCover
            ? <img src={journey.cover_image_url} alt={journey.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            : <span>{journey.cover_emoji}</span>}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
        {locked && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Lock className="h-6 w-6 text-white/80" /></div>}
        {!locked && isDone && <div className="absolute top-1.5 left-1.5 bg-green-500/90 rounded-full px-1.5 py-0.5 flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5 text-white" /><span className="text-[9px] text-white font-medium">Concluída</span></div>}
        {!locked && isActive && <div className="absolute top-1.5 left-1.5 bg-primary/90 rounded-full px-1.5 py-0.5 flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-white" /><span className="text-[9px] text-white font-medium">Ativa</span></div>}
        {!locked && (isActive || isDone) && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div className="h-full bg-primary" style={{ width: `${isDone ? 100 : progress}%` }} />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <p className="text-xs font-medium text-foreground leading-tight truncate">{journey.title}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{journey.duration_days ? `${journey.duration_days}d` : ""} {total} treinos</p>
    </div>
  );
};

// ── Journey Detail Modal ───────────────────────────────────────
const JourneyDetailModal = ({ journey, studentJourney, hasAccess, onClose, onStart, starting }) => {
  const total = journey.journey_workouts?.[0]?.count ?? 0;
  const isActive = studentJourney?.status === "active";
  const isDone = studentJourney?.status === "completed";
  const locked = !hasAccess;
  const hasCover = !!journey.cover_image_url;
  const completed = studentJourney?.completed_workouts ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm p-0 overflow-hidden">
        <div className="h-44 flex items-center justify-center relative overflow-hidden"
          style={{ background: hasCover ? "transparent" : journey.cover_color, filter: locked ? "grayscale(60%)" : "none" }}>
          {hasCover
            ? <img src={journey.cover_image_url} alt={journey.title} className="absolute inset-0 w-full h-full object-cover" />
            : <span className="text-7xl">{journey.cover_emoji}</span>}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          {locked && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Lock className="h-10 w-10 text-white/80" /></div>}
        </div>
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold">{journey.title}</h2>
            {journey.description && <p className="text-sm text-muted-foreground mt-1">{journey.description}</p>}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-secondary rounded-lg p-2"><p className="text-sm font-medium">{journey.duration_days ?? "—"}d</p><p className="text-xs text-muted-foreground">Duração</p></div>
            <div className="bg-secondary rounded-lg p-2"><p className="text-sm font-medium">{total}</p><p className="text-xs text-muted-foreground">Treinos</p></div>
            <div className="bg-secondary rounded-lg p-2"><p className={cn("text-sm font-medium", DIFFICULTY_LABEL[journey.difficulty]?.color)}>{DIFFICULTY_LABEL[journey.difficulty]?.label ?? "—"}</p><p className="text-xs text-muted-foreground">Nível</p></div>
          </div>
          {!locked && isActive && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Progresso</span><span>{progress}%</span></div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} /></div>
              <p className="text-xs text-muted-foreground mt-1">Dia {completed} de {total}</p>
            </div>
          )}
          {locked && (
            <div className="bg-secondary/60 rounded-xl p-4 text-center space-y-3">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">Jornada bloqueada</p>
              <p className="text-xs text-muted-foreground">Fale com seu personal para liberar.</p>
              <Button className="w-full bg-green-600 hover:bg-green-500 text-white" onClick={() => openWhatsApp(`Olá! Tenho interesse em liberar acesso à jornada "${journey.title}". Poderia me ajudar?`)}>
                <MessageCircle className="h-4 w-4 mr-2" />Falar com o personal
              </Button>
            </div>
          )}
          {!locked && !isDone && (
            <Button className="w-full" onClick={onStart} disabled={starting}>
              {starting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Iniciando...</> : isActive ? "Continuar jornada" : "Iniciar jornada"}
            </Button>
          )}
          {!locked && isDone && (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-400"><CheckCircle2 className="h-5 w-5" /><p className="font-medium">Jornada concluída!</p></div>
              <Button variant="outline" className="w-full" onClick={() => openWhatsApp(`Olá! Concluí a jornada "${journey.title}" e gostaria de saber qual é o próximo passo!`)}>
                <MessageCircle className="h-4 w-4 mr-2" />Falar com o personal
              </Button>
            </div>
          )}
          <Button variant="ghost" className="w-full" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Workout Card ───────────────────────────────────────────────
const WorkoutCard = ({ workout, isNext, isOngoing, alreadyToday, sessions, navigate, onPdfClick }) => {
  const doneCount = sessions.filter(s => s.workout_id === workout.id && s.finished).length;
  const last = sessions.find(s => s.workout_id === workout.id && s.finished);
  const expired = isExpiredWorkout(workout);
  return (
    <div className={cn("rounded-2xl border transition-all overflow-hidden",
      expired ? "bg-muted/10 border-border/40 opacity-60"
      : isOngoing ? "bg-blue-500/5 border-blue-500/25"
      : isNext && !alreadyToday ? "bg-primary/5 border-primary/30 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.3)]"
      : "bg-card border-border")}>
      <div className="flex items-center gap-4 p-4 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => !expired && navigate(`/student/workout/${workout.id}`)}>
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border flex-shrink-0",
          expired ? "bg-muted/40 border-border/40"
          : isOngoing ? "bg-blue-500/15 border-blue-500/30"
          : isNext && !alreadyToday ? "bg-primary/15 border-primary/25"
          : "bg-muted border-border")}>
          {expired ? <Lock className="h-5 w-5 text-muted-foreground/40" />
          : isOngoing ? <Play className="h-5 w-5 text-blue-400" />
          : isNext && !alreadyToday ? <Star className="h-5 w-5 text-primary" />
          : <Dumbbell className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <p className={cn("font-bold text-sm truncate", expired ? "text-muted-foreground" : "text-foreground")}>{workout.title}</p>
            {expired && <Badge variant="destructive" className="text-[10px] px-1.5">Expirado</Badge>}
            {!expired && isOngoing && <Badge className="text-[10px] px-1.5 bg-blue-500/20 text-blue-400 border-blue-500/30 border">Em andamento</Badge>}
            {!expired && isNext && !alreadyToday && !isOngoing && <Badge variant="premium" className="text-[10px] px-1.5">Hoje ⚡</Badge>}
            {!expired && alreadyToday && isNext && <Badge className="text-[10px] px-1.5 bg-green-500/20 text-green-400 border-green-500/30 border">✓ Feito</Badge>}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Trophy className="h-3 w-3" />{doneCount} {doneCount===1?"sessão":"sessões"}</span>
            {last && <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{new Date(last.session_date+"T12:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</span>}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
      </div>
      {workout.pdf_url && !expired && (
        <button className="w-full flex items-center gap-2 px-4 py-3 border-t border-border/50 bg-primary/5 hover:bg-primary/10 transition-colors" onClick={e => { e.stopPropagation(); onPdfClick(workout.pdf_url); }}>
          <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span className="text-xs text-primary font-semibold flex-1 text-left">Ver PDF do Treino</span>
          <ArrowRight className="h-3 w-3 text-primary" />
        </button>
      )}
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────
const StudentWorkoutsPage = () => {
  const navigate = useNavigate();
  const { user, profile, logout, loading: authLoading } = useAuth();

  // Treinos personalizados
  const [workouts, setWorkouts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const [error, setError] = useState(null);
  const [showExpired, setShowExpired] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Jornadas
  const [journeys, setJourneys] = useState([]);
  const [categories, setCategories] = useState([]);
  const [studentJourneys, setStudentJourneys] = useState([]);
  const [grantedIds, setGrantedIds] = useState(new Set());
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [starting, setStarting] = useState(false);
  const [profileId, setProfileId] = useState(null);

  const isExpired = profile?.access_end ? new Date(profile.access_end + "T23:59") < new Date() : false;

  // Carrega treinos personalizados
  const loadWorkouts = useCallback(async () => {
    if (!user) { setLoadingWorkouts(false); return; }
    setLoadingWorkouts(true); setError(null);
    try {
      const [wRes, sRes] = await Promise.all([
        supabase.from("student_workouts").select("id, title, status, end_date, pdf_url, created_at, template_id").eq("student_id", user.id).eq("status", "active").order("created_at", { ascending: true }),
        supabase.from("workout_sessions").select("id, workout_id, session_date, finished, status").eq("student_id", user.id).gte("session_date", new Date(Date.now()-30*86400000).toISOString().split("T")[0]).order("session_date", { ascending: false }),
      ]);
      if (wRes.error) throw wRes.error;
      if (sRes.error) throw sRes.error;
      const rawWorkouts = wRes.data || [];
      const templateIds = [...new Set(rawWorkouts.map(w => w.template_id).filter(Boolean))];
      let pdfMap = {};
      if (templateIds.length) {
        const { data: tmplData } = await supabase.from("workout_templates").select("id, pdf_url").in("id", templateIds);
        (tmplData || []).forEach(t => { if (t.pdf_url) pdfMap[t.id] = t.pdf_url; });
      }
      setWorkouts(rawWorkouts.map(w => ({ ...w, pdf_url: w.pdf_url || pdfMap[w.template_id] || null })));
      setSessions(sRes.data || []);
    } catch (err) { if (err?.name !== "AbortError" && !err?.message?.includes("aborted")) setError(err.message); }
    finally { setLoadingWorkouts(false); }
  }, [user]);

  // Carrega jornadas
  const loadJourneys = useCallback(async () => {
    if (!user) { setLoadingJourneys(false); return; }
    setLoadingJourneys(true);
    try {
      const { data: prof } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      setProfileId(prof.id);
      const [j, c, sj, ids] = await Promise.all([
        getJourneys(),
        getCategories(),
        getStudentJourneys(prof.id),
        getGrantedJourneyIds(prof.id),
      ]);
      setJourneys(j); setCategories(c); setStudentJourneys(sj); setGrantedIds(new Set(ids));
    } catch { /* silencioso */ }
    finally { setLoadingJourneys(false); }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user?.id) return;
    const timer = setTimeout(() => { loadWorkouts(); loadJourneys(); }, 150);
    return () => clearTimeout(timer);
  }, [user?.id, authLoading]); // eslint-disable-line

  const handleEnroll = async (journey) => {
    if (!profileId) return;
    setStarting(true);
    try {
      await enrollStudentInJourney(profileId, journey.id);
      toast.success(`Jornada "${journey.title}" iniciada! 🚀`);
      await loadJourneys();
      setSelectedJourney(null);
    } catch { toast.error("Erro ao iniciar jornada"); }
    finally { setStarting(false); }
  };

  // Derived state — treinos
  const activeWorkouts = workouts.filter(w => !isExpiredWorkout(w));
  const expiredWorkouts = workouts.filter(w => isExpiredWorkout(w));
  const hasPersonalWorkouts = activeWorkouts.length > 0;
  const nextIdx = getNextWorkoutIndex(activeWorkouts, sessions);
  const alreadyToday = trainedToday(sessions);
  const ongoing = activeSessionToday(sessions);
  const todayWorkout = activeWorkouts[nextIdx] || null;

  const weekCount = sessions.filter(s => {
    if (!s.finished) return false;
    const d = new Date(); d.setDate(d.getDate() - d.getDay());
    return new Date(s.session_date+"T12:00") >= d;
  }).length;

  const streak = (() => {
    let count = alreadyToday ? 1 : 0;
    const done = new Set(sessions.filter(s => s.finished).map(s => s.session_date));
    const d = new Date(); d.setDate(d.getDate()-1);
    while (done.has(d.toISOString().split("T")[0])) { count++; d.setDate(d.getDate()-1); }
    return count;
  })();

  // Derived state — jornadas
  const getStudentJourney = (id) => studentJourneys.find(sj => sj.journey_id === id) ?? null;
  const myJourneys = journeys.filter(j => studentJourneys.some(sj => sj.journey_id === j.id));
  const availableJourneys = journeys.filter(j => grantedIds.has(j.id) && !studentJourneys.some(sj => sj.journey_id === j.id));
  const lockedJourneys = journeys.filter(j => !grantedIds.has(j.id));

  const selectedStudentJourney = selectedJourney ? getStudentJourney(selectedJourney.id) : null;
  const selectedHasAccess = selectedJourney ? grantedIds.has(selectedJourney.id) : false;

  const loading = loadingWorkouts || loadingJourneys;

  // ── Tela de acesso expirado ─────────────────────────────────
  if (!loading && isExpired) {
    return (
      <MobileContainer>
        <MobileHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-primary" /></div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{profile?.name || "Aluno"}</p>
                <span className="text-destructive text-[11px] font-medium">Acesso expirado</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={async () => { try { await logout(); } catch {} }}><LogOut className="h-4 w-4 text-muted-foreground" /></Button>
          </div>
        </MobileHeader>
        <MobileContent>
          <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 text-center gap-6">
            <div className="h-24 w-24 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center"><Lock className="h-11 w-11 text-destructive/60" /></div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Acesso Expirado</h2>
              <p className="text-sm text-muted-foreground max-w-[260px]">Seu plano expirou em <span className="text-foreground font-semibold">{profile?.access_end ? new Date(profile.access_end+"T12:00").toLocaleDateString("pt-BR") : "—"}</span>. Fale com seu personal para renovar!</p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-[260px]">
              <Button variant="premium" className="w-full gap-2 py-6" onClick={() => window.open(waLink("Olá! Gostaria de renovar meu plano no Santana Method. 🏋️"), "_blank")}><WhatsAppIcon />Falar com o Personal</Button>
              <Button variant="outline" className="w-full" onClick={async () => { await logout(); }}>Sair da conta</Button>
            </div>
          </div>
        </MobileContent>
      </MobileContainer>
    );
  }

  // ── Tela principal ──────────────────────────────────────────
  return (
    <MobileContainer>
      <MobileHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-primary" /></div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{profile?.name || "Aluno"}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {profile?.access_end ? `Ativo até ${new Date(profile.access_end+"T12:00").toLocaleDateString("pt-BR")}` : "Aluno ativo"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { loadWorkouts(); loadJourneys(); }}><RefreshCw className="h-4 w-4 text-muted-foreground" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={async () => { try { await logout(); } catch {} }}><LogOut className="h-4 w-4 text-muted-foreground" /></Button>
          </div>
        </div>
      </MobileHeader>

      <MobileContent className="pb-32 px-4">
        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={loadWorkouts}><RefreshCw className="h-4 w-4 mr-2" />Tentar novamente</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 pt-3">

            {/* ── Stats ── */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: "Treinos", value: activeWorkouts.length, color: "text-primary" },
                { label: "Essa semana", value: weekCount, color: "text-foreground" },
                { label: streak >= 2 ? "🔥 Streak" : "Sequência", value: streak, color: "text-foreground" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
                  <p className={cn("text-2xl font-black leading-none mb-1.5", color)}>{value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>

            {/* ── CONSULTORIA PERSONALIZADA ── */}
            {hasPersonalWorkouts ? (
              <div className="space-y-3">
                <SectionLabel icon={Crown}>Meu Programa Personalizado</SectionLabel>

                {/* Treino de hoje */}
                {todayWorkout && (
                  <WorkoutCard workout={todayWorkout} isNext={true} isOngoing={ongoing?.workout_id === todayWorkout.id} alreadyToday={alreadyToday} sessions={sessions} navigate={navigate} onPdfClick={setPdfUrl} />
                )}

                {/* Concluído hoje */}
                {alreadyToday && (
                  <div className="flex items-center gap-3.5 bg-green-500/8 border border-green-500/20 rounded-2xl px-4 py-4">
                    <div className="h-10 w-10 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="h-5 w-5 text-green-400" /></div>
                    <div>
                      <p className="text-sm font-bold text-green-400">Treino concluído hoje! 🏆</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activeWorkouts.length > 1 ? "Amanhã começa o próximo." : "Repita quando quiser!"}</p>
                    </div>
                  </div>
                )}

                {/* Todos os treinos se > 1 */}
                {activeWorkouts.length > 1 && (
                  <div className="flex flex-col gap-2.5">
                    {activeWorkouts.map((w, idx) => (
                      <WorkoutCard key={w.id} workout={w} isNext={idx===nextIdx} isOngoing={ongoing?.workout_id===w.id} alreadyToday={alreadyToday} sessions={sessions} navigate={navigate} onPdfClick={setPdfUrl} />
                    ))}
                  </div>
                )}

                {/* Expirados */}
                {expiredWorkouts.length > 0 && (
                  <div>
                    <button className="flex items-center gap-2 w-full mb-2" onClick={() => setShowExpired(p => !p)}>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Expirados ({expiredWorkouts.length})</p>
                      <div className="flex-1 h-px bg-border/40" />
                      {showExpired ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                    {showExpired && (
                      <div className="flex flex-col gap-2.5">
                        {expiredWorkouts.map(w => <WorkoutCard key={w.id} workout={w} isNext={false} isOngoing={false} alreadyToday={alreadyToday} sessions={sessions} navigate={navigate} onPdfClick={setPdfUrl} />)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ── SEM CONSULTORIA — CTA ── */
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0"><Crown className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="font-semibold text-sm">Consultoria Personalizada</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Treinos feitos especialmente para você, com acompanhamento do seu personal.</p>
                  </div>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-500 text-white gap-2" onClick={() => window.open(waLink("Olá! Tenho interesse na consultoria personalizada do Santana Method. Pode me passar mais informações? 💪"), "_blank")}>
                  <MessageCircle className="h-4 w-4" />Quero consultoria personalizada
                </Button>
              </div>
            )}

            {/* ── CATÁLOGO DE JORNADAS ── */}
            {journeys.length > 0 && (
              <div className="space-y-1">
                <SectionLabel icon={BookOpen}>Jornadas de Treino</SectionLabel>
                <p className="text-xs text-muted-foreground mb-4">
                  {hasPersonalWorkouts
                    ? "Explore programas para complementar seu treino"
                    : "Escolha uma jornada e comece seu programa"}
                </p>

                {/* Minhas jornadas ativas */}
                {myJourneys.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-medium text-primary mb-2">Em andamento</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {myJourneys.map(j => <JourneyCard key={j.id} journey={j} studentJourney={getStudentJourney(j.id)} hasAccess={grantedIds.has(j.id)} onSelect={setSelectedJourney} />)}
                    </div>
                  </div>
                )}

                {/* Por categoria */}
                {categories.map(cat => {
                  const catJourneys = availableJourneys.filter(j => j.category_id === cat.id);
                  if (!catJourneys.length) return null;
                  return (
                    <div key={cat.id} className="mb-5">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{cat.emoji} {cat.name}</p>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                        {catJourneys.map(j => <JourneyCard key={j.id} journey={j} studentJourney={getStudentJourney(j.id)} hasAccess={true} onSelect={setSelectedJourney} />)}
                      </div>
                    </div>
                  );
                })}

                {/* Sem categoria */}
                {availableJourneys.filter(j => !j.category_id).length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Disponíveis</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {availableJourneys.filter(j => !j.category_id).map(j => <JourneyCard key={j.id} journey={j} studentJourney={getStudentJourney(j.id)} hasAccess={true} onSelect={setSelectedJourney} />)}
                    </div>
                  </div>
                )}

                {/* Bloqueadas */}
                {lockedJourneys.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">🔒 Em breve</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {lockedJourneys.map(j => <JourneyCard key={j.id} journey={j} studentJourney={null} hasAccess={false} onSelect={setSelectedJourney} />)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Estado vazio — sem treinos e sem jornadas */}
            {!hasPersonalWorkouts && journeys.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"><Dumbbell className="h-9 w-9 text-primary" /></div>
                <div>
                  <h2 className="text-xl font-bold">Nenhum treino ainda</h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">Seu personal ainda não configurou seus treinos. Aguarde ou entre em contato.</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => window.open(waLink("Olá! Estou aguardando meu treino no Santana Method. 💪"), "_blank")}><WhatsAppIcon />Avisar o Personal</Button>
              </div>
            )}

          </div>
        )}
      </MobileContent>

      {/* Footer CTA — só se tem treino personalizado */}
      {!loading && !error && !isExpired && hasPersonalWorkouts && todayWorkout && (
        <MobileFooter>
          <Button variant="premium" size="xl" className="w-full gap-2" onClick={() => {
            const target = ongoing ? (workouts.find(w => w.id===ongoing.workout_id)||todayWorkout) : todayWorkout;
            navigate(`/student/workout/${target.id}`);
          }}>
            {ongoing ? <><Play className="h-5 w-5" />Continuar Treino</>
            : alreadyToday ? <><RefreshCw className="h-5 w-5" />Repetir Treino</>
            : <><Dumbbell className="h-5 w-5" />Iniciar Treino de Hoje</>}
          </Button>
        </MobileFooter>
      )}

      {selectedJourney && (
        <JourneyDetailModal
          journey={selectedJourney}
          studentJourney={selectedStudentJourney}
          hasAccess={selectedHasAccess}
          onClose={() => setSelectedJourney(null)}
          onStart={() => {
            if (selectedStudentJourney?.status === "active") { setSelectedJourney(null); }
            else handleEnroll(selectedJourney);
          }}
          starting={starting}
        />
      )}

      {pdfUrl && <PdfModal url={pdfUrl} onClose={() => setPdfUrl(null)} />}
    </MobileContainer>
  );
};

export default StudentWorkoutsPage;
