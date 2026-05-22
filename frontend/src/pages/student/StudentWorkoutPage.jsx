import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  MobileContainer, MobileHeader, MobileContent, MobileFooter,
} from "@/components/layout/MobileContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  User, Dumbbell, LogOut, Loader2, ChevronLeft,
  ChevronDown, ChevronUp, CheckCircle2, Clock, Repeat,
  Layers, Video, Play, RefreshCw, Trophy, AlertCircle,
  Lock, FileText, X, HelpCircle, Zap, Weight, StickyNote,
  Timer, Plus, Minus, History,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { incrementJourneyProgress, getStudentJourneys } from "@/services/journeyService";

// ── Config ─────────────────────────────────────────────────────
const blockTypeConfig = {
  normal:   { label: "Normal",    color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  single:   { label: "Simples",   color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  biset:    { label: "Biset",     color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  triset:   { label: "Triset",    color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  circuit:  { label: "Circuito",  color: "bg-green-500/15 text-green-400 border-green-500/30" },
  dropset:  { label: "Drop Set",  color: "bg-red-500/15 text-red-400 border-red-500/30" },
  giantset: { label: "Giant Set", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
};

function getYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── PDF Modal ──────────────────────────────────────────────────
const PDFJS_CDN    = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
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
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-start justify-center p-3 bg-muted/20">
          {pdfLoading && <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {pdfError && <div className="flex flex-col items-center py-16 gap-3"><p className="text-sm text-muted-foreground">Não foi possível carregar.</p><a href={url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm">Abrir em nova aba</Button></a></div>}
          {!pdfLoading && !pdfError && <canvas ref={canvasRef} className="shadow-lg max-w-full rounded" />}
        </div>
      </div>
    </div>
  );
};

// ── Timer de descanso ──────────────────────────────────────────
const RestTimer = ({ seconds, onDone, onSkip }) => {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onDone?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const pct = ((seconds - remaining) / seconds) * 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="bg-card border border-primary/30 rounded-2xl p-4 flex items-center gap-4 animate-fade-in">
      {/* Círculo */}
      <div className="relative w-14 h-14 flex-shrink-0">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
          <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--primary))" strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 24}`}
            strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">{mins > 0 ? `${mins}:${String(secs).padStart(2,"0")}` : `${remaining}s`}</span>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 text-primary" /> Descanso
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Próxima série em {mins > 0 ? `${mins}min ${secs}s` : `${remaining}s`}</p>
      </div>
      <Button variant="ghost" size="sm" className="text-xs h-8" onClick={onSkip}>Pular</Button>
    </div>
  );
};

// ── Registro de série ──────────────────────────────────────────
const SetRow = ({ setNum, exerciseRowId, sessionId, studentId, workoutId, restSeconds, onComplete, lastLoad, lastReps, disabled }) => {
  const [kg, setKg] = useState(lastLoad ?? "");
  const [reps, setReps] = useState(lastReps ?? "");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const handleDone = async () => {
    if (disabled) { toast("Inicie o treino primeiro ⚡"); return; }
    setSaving(true);
    try {
      await supabase.from("workout_exercise_logs").upsert({
        session_id: sessionId,
        student_workout_id: workoutId,
        student_id: studentId,
        exercise_row_id: exerciseRowId,
        set_number: setNum,
        actual_load: kg ? String(kg) : null,
        actual_reps: reps ? Number(reps) : null,
        completed_at: new Date().toISOString(),
      }, { onConflict: "session_id,exercise_row_id,set_number" });
      setDone(true);
      onComplete?.();
      if (restSeconds) setShowTimer(true);
    } catch (err) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (showTimer) {
    return <RestTimer seconds={restSeconds} onDone={() => setShowTimer(false)} onSkip={() => setShowTimer(false)} />;
  }

  return (
    <div className={cn("flex items-center gap-2 py-2 px-1 rounded-xl transition-all", done && "opacity-60")}>
      {/* Número */}
      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0", done ? "bg-green-400 text-black" : "bg-muted text-muted-foreground")}>
        {done ? "✓" : setNum}
      </div>

      {/* kg */}
      <div className="flex items-center gap-1 flex-1">
        <Input
          type="number"
          placeholder="kg"
          value={kg}
          onChange={e => setKg(e.target.value)}
          disabled={done}
          className="h-8 text-sm text-center bg-secondary border-border w-full"
        />
        <span className="text-xs text-muted-foreground flex-shrink-0">kg</span>
      </div>

      {/* reps */}
      <div className="flex items-center gap-1 flex-1">
        <Input
          type="number"
          placeholder="reps"
          value={reps}
          onChange={e => setReps(e.target.value)}
          disabled={done}
          className="h-8 text-sm text-center bg-secondary border-border w-full"
        />
        <span className="text-xs text-muted-foreground flex-shrink-0">reps</span>
      </div>

      {/* Confirmar */}
      <Button
        size="sm"
        variant={done ? "ghost" : "outline"}
        className={cn("h-8 w-8 p-0 flex-shrink-0", done && "text-green-400 border-green-400/30")}
        onClick={handleDone}
        disabled={done || saving}
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
};

// ── Labels PT-BR ───────────────────────────────────────────────
const MUSCLE_LABELS = { chest:"Peitoral",back:"Costas",shoulders:"Ombros",biceps:"Bíceps",triceps:"Tríceps",forearms:"Antebraço",core:"Core/Abdômen",glutes:"Glúteos",quads:"Quadríceps",hamstrings:"Post. Coxa",adductors:"Adutores",calves:"Panturrilha",full_body:"Corpo Inteiro",cardio:"Cardio",legs:"Pernas" };
const EQUIP_LABELS  = { barbell:"Barra",dumbbell:"Halteres",cable:"Cabo/Polia",machine:"Máquina",bodyweight:"Peso Corporal",kettlebell:"Kettlebell",band:"Elástico",smith:"Smith",trap_bar:"Trap Bar",bench:"Banco",other:"Outro" };
const DIFF_LABELS   = { beginner:"Iniciante",intermediate:"Intermediário",advanced:"Avançado" };
const CAT_LABELS    = { strength:"Força",hypertrophy:"Hipertrofia",endurance:"Resistência",power:"Potência",mobility:"Mobilidade",cardio:"Cardio" };
const MECH_LABELS   = { compound:"Composto",isolation:"Isolado" };
const FORCE_LABELS  = { push:"Empurrar",pull:"Puxar",legs:"Pernas",core:"Core",rotation:"Rotação",stabilization:"Estabilização" };
const label = (map, val) => val ? (map[val] || val) : null;

// ── Modal detalhes exercício ───────────────────────────────────
const ExerciseDetailModal = ({ exercise, onClose }) => {
  if (!exercise) return null;
  const ytId = getYoutubeId(exercise.video_url);
  const Chip = ({ icon: Icon, label: lbl, value, accent }) => (
    <div className={cn("flex items-center gap-2 rounded-xl p-3", accent ? "bg-primary/10 border border-primary/20" : "bg-muted/60 border border-border/40")}>
      <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", accent ? "text-primary" : "text-muted-foreground")} />
      <div className="min-w-0"><p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-1">{lbl}</p><p className={cn("text-xs font-bold leading-none truncate", accent ? "text-primary" : "text-foreground")}>{value}</p></div>
    </div>
  );
  const Section = ({ title, children }) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2"><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p><div className="flex-1 h-px bg-border/50" /></div>
      <div>{children}</div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md p-0 sm:p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden flex flex-col shadow-2xl" style={{ maxHeight: "92dvh" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2"><p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Detalhes do Exercício</p><h2 className="font-bold text-lg leading-tight">{exercise.exercise_name}</h2></div>
          <button className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {ytId && <div className="aspect-video bg-black w-full"><iframe src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={exercise.exercise_name} /></div>}
          <div className="px-5 py-6 flex flex-col gap-5">
            {(exercise.sets || exercise.reps || exercise.rest_seconds) && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">📋 Prescrição</p>
                <div className="grid grid-cols-3 gap-2">
                  {exercise.sets && <div className="text-center bg-background/40 rounded-xl py-3"><p className="text-3xl font-black text-primary leading-none">{exercise.sets}</p><p className="text-[10px] text-muted-foreground mt-1.5 uppercase">séries</p></div>}
                  {exercise.reps && <div className="text-center bg-background/40 rounded-xl py-3"><p className="text-3xl font-black text-foreground leading-none">{exercise.reps}</p><p className="text-[10px] text-muted-foreground mt-1.5 uppercase">reps</p></div>}
                  {exercise.rest_seconds && <div className="text-center bg-background/40 rounded-xl py-3"><p className="text-3xl font-black text-foreground leading-none">{exercise.rest_seconds}<span className="text-lg font-bold">s</span></p><p className="text-[10px] text-muted-foreground mt-1.5 uppercase">descanso</p></div>}
                </div>
              </div>
            )}
            {(exercise.muscle_group || exercise.equipment || exercise.difficulty) && (
              <div className="grid grid-cols-3 gap-2">
                {exercise.muscle_group && <Chip icon={Dumbbell} label="Músculo" value={label(MUSCLE_LABELS, exercise.muscle_group)} />}
                {exercise.equipment && <Chip icon={Layers} label="Equipamento" value={label(EQUIP_LABELS, exercise.equipment)} />}
                {exercise.difficulty && <Chip icon={Zap} label="Nível" value={label(DIFF_LABELS, exercise.difficulty)} />}
              </div>
            )}
            {exercise.default_description && <Section title="Descrição"><p className="text-sm text-muted-foreground leading-relaxed">{exercise.default_description}</p></Section>}
            {exercise.instructions && <Section title="Como executar"><div className="bg-muted/30 rounded-2xl p-4"><p className="text-sm leading-relaxed whitespace-pre-line">{exercise.instructions}</p></div></Section>}
            {exercise.tips && <Section title="Dicas"><div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3"><StickyNote className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" /><p className="text-sm leading-relaxed">{exercise.tips}</p></div></Section>}
            {exercise.obs && <Section title="Obs."><div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex gap-3"><StickyNote className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" /><p className="text-sm">{exercise.obs}</p></div></Section>}
          </div>
        </div>
        {exercise.video_url && <div className="px-5 py-4 border-t border-border flex-shrink-0"><a href={exercise.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm text-primary font-medium hover:underline"><Video className="h-4 w-4" />Abrir vídeo em nova aba</a></div>}
      </div>
    </div>
  );
};

// ── Página principal ───────────────────────────────────────────
const StudentWorkoutPage = () => {
  const { id: workoutId } = useParams();
  const navigate = useNavigate();
  const { user, profile, logout, loading: authLoading } = useAuth();

  const [workout, setWorkout]       = useState(null);
  const [blocks, setBlocks]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [completedSets, setCompletedSets] = useState({}); // { exerciseRowId: Set<setNum> }
  const [expandedBlocks, setExpandedBlocks] = useState(new Set());
  const [expandedVideos, setExpandedVideos] = useState(new Set());
  const [activeSession, setActiveSession]   = useState(null);
  const [starting, setStarting]     = useState(false);
  const [finishing, setFinishing]   = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [isExpired, setIsExpired]   = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [detailExercise, setDetailExercise] = useState(null);
  const [lastLogs, setLastLogs]     = useState({}); // { exerciseRowId: { kg, reps } }

  const loadWorkout = useCallback(async () => {
    if (!user || !workoutId) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const { data: sw, error: swErr } = await supabase
        .from("student_workouts").select("*").eq("id", workoutId).eq("student_id", user.id).single();
      if (swErr) throw swErr;

      let pdfUrl = sw.pdf_url || null;
      if (!pdfUrl && sw.template_id) {
        const { data: tmpl } = await supabase.from("workout_templates").select("pdf_url").eq("id", sw.template_id).maybeSingle();
        pdfUrl = tmpl?.pdf_url || null;
      }
      setWorkout({ ...sw, pdf_url: pdfUrl });

      const todayStr = new Date().toISOString().split("T")[0];
      if (sw.end_date && sw.end_date < todayStr) { setIsExpired(true); setLoading(false); return; }

      const { data: rows, error: viewErr } = await supabase
        .from("v_student_workout").select("*").eq("workout_id", workoutId).eq("student_id", user.id)
        .order("block_order", { ascending: true }).order("exercise_order", { ascending: true });
      if (viewErr) throw viewErr;

      const { data: blockData } = await supabase
        .from("student_workout_blocks").select("id, block_type, order_index, rest_after_block_seconds").eq("student_workout_id", workoutId);
      const blockTypeMap = Object.fromEntries((blockData || []).map(b => [b.id, { type: b.block_type, rest: b.rest_after_block_seconds }]));

      const blockMap = {};
      for (const row of rows || []) {
        if (!blockMap[row.block_id]) {
          blockMap[row.block_id] = {
            block_id: row.block_id, block_label: row.block_label,
            block_type: blockTypeMap[row.block_id]?.type || "normal",
            rest_seconds: blockTypeMap[row.block_id]?.rest || 60,
            block_order: row.block_order, exercises: [],
          };
        }
        blockMap[row.block_id].exercises.push(row);
      }
      const sortedBlocks = Object.values(blockMap).sort((a, b) => a.block_order - b.block_order);
      setBlocks(sortedBlocks);
      if (sortedBlocks.length > 0) setExpandedBlocks(new Set([sortedBlocks[0].block_id]));

      // Sessão ativa hoje
      const today = new Date().toISOString().split("T")[0];
      const { data: session } = await supabase
        .from("workout_sessions").select("*").eq("student_id", user.id).eq("workout_id", workoutId)
        .eq("session_date", today).eq("finished", false).maybeSingle();

      if (session) {
        setActiveSession(session);
        // Carrega séries já completadas
        const { data: logs } = await supabase
          .from("workout_exercise_logs").select("exercise_row_id, set_number, actual_load, actual_reps")
          .eq("session_id", session.id);
        if (logs?.length) {
          const setsMap = {};
          const logsMap = {};
          for (const log of logs) {
            if (!setsMap[log.exercise_row_id]) setsMap[log.exercise_row_id] = new Set();
            setsMap[log.exercise_row_id].add(log.set_number);
            logsMap[log.exercise_row_id] = { kg: log.actual_load, reps: log.actual_reps };
          }
          setCompletedSets(setsMap);
          setLastLogs(logsMap);
        }
      }

      // Histórico da última sessão para referência de carga
      const { data: lastSession } = await supabase
        .from("workout_sessions").select("id").eq("student_id", user.id).eq("workout_id", workoutId)
        .eq("finished", true).order("session_date", { ascending: false }).limit(1).maybeSingle();
      if (lastSession) {
        const { data: prevLogs } = await supabase
          .from("workout_exercise_logs").select("exercise_row_id, actual_load, actual_reps, set_number")
          .eq("session_id", lastSession.id);
        if (prevLogs?.length) {
          const prev = {};
          for (const log of prevLogs) {
            if (!prev[log.exercise_row_id]) prev[log.exercise_row_id] = { kg: log.actual_load, reps: log.actual_reps };
          }
          setLastLogs(prev);
        }
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [user, workoutId]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.id && workoutId) loadWorkout();
    else setLoading(false);
  }, [user?.id, workoutId, authLoading]); // eslint-disable-line

  const toggleBlock = blockId => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      next.has(blockId) ? next.delete(blockId) : next.add(blockId);
      return next;
    });
  };

  const toggleVideo = (key, e) => {
    e.stopPropagation();
    setExpandedVideos(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSetComplete = (exerciseRowId, setNum) => {
    setCompletedSets(prev => {
      const next = { ...prev };
      if (!next[exerciseRowId]) next[exerciseRowId] = new Set();
      next[exerciseRowId] = new Set([...next[exerciseRowId], setNum]);
      return next;
    });
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: todaySession } = await supabase
        .from("workout_sessions").select("*").eq("student_id", user.id).eq("workout_id", workoutId)
        .eq("session_date", today).maybeSingle();

      if (todaySession) {
        if (todaySession.finished) {
          await supabase.from("workout_sessions").update({ status: "active", finished: false, started_at: new Date().toISOString() }).eq("id", todaySession.id);
          setActiveSession({ ...todaySession, status: "active", finished: false });
          setCompletedSets({});
          toast.success("Novo ciclo iniciado! 💪");
        } else {
          setActiveSession(todaySession);
          toast.success("Treino retomado! 💪");
        }
        return;
      }

      const { data: otherActive } = await supabase.from("workout_sessions").select("id").eq("student_id", user.id).eq("status", "active").maybeSingle();
      if (otherActive) {
        await supabase.from("workout_sessions").update({ status: "finished", finished: true, finished_at: new Date().toISOString() }).eq("id", otherActive.id);
      }

      await supabase.from("workout_sessions").insert({ student_id: user.id, workout_id: workoutId, session_date: today, started_at: new Date().toISOString(), status: "active", finished: false });

      const { data: newSession } = await supabase.from("workout_sessions").select("*").eq("student_id", user.id).eq("workout_id", workoutId).eq("session_date", today).maybeSingle();
      if (newSession) { setActiveSession(newSession); setCompletedSets({}); toast.success("Treino iniciado! 💪"); }
      else throw new Error("Sessão criada mas não encontrada.");
    } catch (err) { toast.error("Erro ao iniciar: " + err.message); }
    finally { setStarting(false); }
  };

  const handleFinish = async () => {
    if (!activeSession) return;
    setFinishing(true);
    try {
      await supabase.from("workout_sessions").update({
        finished: true, status: "finished",
        finished_at: new Date().toISOString(), completed_at: new Date().toISOString(),
      }).eq("id", activeSession.id);

      // Incrementa progresso da jornada ativa
      try {
        const sjs = await getStudentJourneys(user.id);
        const activeJourney = sjs?.find(sj => sj.status === "active");
        if (activeJourney) await incrementJourneyProgress(user.id, activeJourney.journey_id);
      } catch { /* silencioso */ }

      setActiveSession(null);
      setShowFinishModal(false);
      toast.success("Treino concluído! 🏆");
      navigate("/student");
    } catch (err) { toast.error("Erro ao finalizar: " + err.message); }
    finally { setFinishing(false); }
  };

  // Derived
  const totalSets = blocks.reduce((sum, b) => sum + b.exercises.reduce((s, ex) => s + (Number(ex.sets) || 1), 0), 0);
  const doneSets  = Object.values(completedSets).reduce((sum, s) => sum + s.size, 0);
  const progressPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;
  const isBlockCompleted = b => b.exercises.every(ex => {
    const sets = Number(ex.sets) || 1;
    const done = completedSets[ex.exercise_row_id]?.size ?? 0;
    return done >= sets;
  });

  return (
    <MobileContainer>
      <MobileHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/student")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{profile?.name || "Aluno"}</p>
                <Badge variant={activeSession ? "premium" : "success"} className="text-[10px] mt-0.5">
                  {activeSession ? "Treinando" : "Aluno"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={loadWorkout}><RefreshCw className="h-4 w-4 text-muted-foreground" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={async () => { try { await logout(); } catch {} }}><LogOut className="h-4 w-4 text-muted-foreground" /></Button>
          </div>
        </div>
      </MobileHeader>

      <MobileContent className="pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : isExpired ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-5">
            <div className="h-24 w-24 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center"><Lock className="h-11 w-11 text-destructive/70" /></div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Treino Expirado</h2>
              <p className="text-sm text-muted-foreground">{workout?.end_date ? `Este treino expirou em ${new Date(workout.end_date+"T12:00:00").toLocaleDateString("pt-BR")}.` : "Este treino não está mais disponível."}</p>
            </div>
            <Button variant="premium" className="w-full max-w-[260px] gap-2 py-6" onClick={() => window.open(`https://wa.me/5511949997913?text=${encodeURIComponent("Olá! Meu treino expirou e gostaria de renovar. 🏋️")}`, "_blank")}>
              Falar com o Personal
            </Button>
            <Button variant="outline" onClick={() => navigate("/student")} className="w-full max-w-[260px]"><ChevronLeft className="h-4 w-4 mr-1" />Voltar</Button>
          </div>
        ) : error ? (
          <Card className="bg-card border-destructive/30 mt-4"><CardContent className="py-10 text-center"><AlertCircle className="h-10 w-10 mx-auto text-destructive mb-3" /><p className="text-destructive font-medium mb-4">{error}</p><Button variant="outline" size="sm" onClick={loadWorkout}><RefreshCw className="h-4 w-4 mr-2" />Tentar novamente</Button></CardContent></Card>
        ) : (
          <div className="space-y-5 pt-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Badge variant="premium" className="text-xs mb-2">Treino Atual</Badge>
                <h1 className="text-2xl font-bold leading-tight">{workout?.title || "Treino"}</h1>
                <p className="text-sm text-muted-foreground mt-1">{blocks.length} blocos · {totalSets} séries</p>
              </div>
              {workout?.pdf_url && (
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex-shrink-0" onClick={() => setShowPdfModal(true)}>
                  <FileText className="h-3.5 w-3.5" />Ver PDF
                </button>
              )}
            </div>

            {/* Barra de progresso */}
            {activeSession && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Progresso</span>
                  <span className="font-bold">{doneSets}/{totalSets} séries</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500", progressPct===100 ? "bg-green-400" : "bg-primary")} style={{ width: `${progressPct}%` }} />
                </div>
                {progressPct===100 && <p className="text-xs text-center text-green-400 font-semibold">🏆 Todas as séries concluídas!</p>}
              </div>
            )}

            {/* Blocos */}
            <div className="space-y-4">
              {blocks.map(block => {
                const isExpanded = expandedBlocks.has(block.block_id);
                const blockDone = isBlockCompleted(block);
                const typeCfg = blockTypeConfig[block.block_type] || blockTypeConfig.normal;

                return (
                  <Card key={block.block_id} className={cn("border transition-all overflow-hidden rounded-2xl", blockDone ? "bg-green-500/5 border-green-500/30" : "bg-card border-border")}>
                    <div className="flex items-center justify-between px-4 py-4 cursor-pointer" onClick={() => toggleBlock(block.block_id)}>
                      <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border flex-shrink-0", blockDone ? "bg-green-500/10 border-green-500/30" : "bg-primary/10 border-primary/20")}>
                          {blockDone ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Layers className="h-4 w-4 text-primary" />}
                        </div>
                        <div>
                          <p className={cn("font-semibold text-base", blockDone ? "text-green-400" : "text-foreground")}>
                            {block.block_label || `Bloco ${String.fromCharCode(64 + (blocks.indexOf(block)+1))}`}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border", typeCfg.color)}>{typeCfg.label}</span>
                            <span className="text-[10px] text-muted-foreground">{block.exercises.length} exerc.</span>
                            {block.rest_seconds && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Timer className="h-2.5 w-2.5" />{block.rest_seconds}s</span>}
                            {blockDone && <span className="text-[10px] text-green-400 font-medium">✓</span>}
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border divide-y divide-border/50">
                        {block.exercises.map((ex, idx) => {
                          const ytId = getYoutubeId(ex.video_url);
                          const videoKey = ex.exercise_row_id || `${block.block_id}-${idx}`;
                          const videoOpen = expandedVideos.has(videoKey);
                          const numSets = Number(ex.sets) || 1;
                          const doneForEx = completedSets[ex.exercise_row_id]?.size ?? 0;
                          const exDone = doneForEx >= numSets;
                          const prevLog = lastLogs[ex.exercise_row_id];

                          return (
                            <div key={videoKey} className={cn("px-4 py-4 transition-colors", exDone && "bg-green-500/5")}>
                              {/* Nome + botões */}
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex-1 min-w-0">
                                  <p className={cn("font-semibold text-base leading-tight", exDone ? "text-green-400" : "text-foreground")}>
                                    {ex.exercise_name}
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                    {ex.sets && <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{ex.sets} séries</span>}
                                    {ex.reps && <span className="flex items-center gap-1"><Repeat className="h-3 w-3" />{ex.reps} reps</span>}
                                    {ex.rest_seconds && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ex.rest_seconds}s</span>}
                                    {ex.load && <span>💪 {ex.load}</span>}
                                  </div>
                                  {/* Referência da última sessão */}
                                  {prevLog?.kg && (
                                    <div className="flex items-center gap-1 mt-1.5">
                                      <History className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">Última: {prevLog.kg}kg × {prevLog.reps || "?"} reps</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {ytId && (
                                    <button className={cn("h-8 w-8 rounded-xl flex items-center justify-center transition-colors", videoOpen ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")} onClick={e => toggleVideo(videoKey, e)}>
                                      <Play className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors" onClick={e => { e.stopPropagation(); setDetailExercise(ex); }}>
                                    <HelpCircle className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Obs */}
                              {ex.obs && (
                                <div className="flex items-start gap-1.5 mb-3">
                                  <StickyNote className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-muted-foreground">{ex.obs}</p>
                                </div>
                              )}

                              {/* Header das séries */}
                              <div className="flex items-center gap-2 mb-1 px-1">
                                <span className="text-[10px] text-muted-foreground w-6 text-center">Série</span>
                                <span className="text-[10px] text-muted-foreground flex-1 text-center">Carga</span>
                                <span className="text-[10px] text-muted-foreground flex-1 text-center">Reps</span>
                                <span className="text-[10px] text-muted-foreground w-8 text-center">✓</span>
                              </div>

                              {/* Séries */}
                              <div className="space-y-1">
                                {Array.from({ length: numSets }, (_, i) => i + 1).map(setNum => (
                                  <SetRow
                                    key={setNum}
                                    setNum={setNum}
                                    exerciseRowId={ex.exercise_row_id}
                                    sessionId={activeSession?.id}
                                    studentId={user?.id}
                                    workoutId={workoutId}
                                    restSeconds={ex.rest_seconds || block.rest_seconds || 60}
                                    onComplete={() => handleSetComplete(ex.exercise_row_id, setNum)}
                                    lastLoad={prevLog?.kg}
                                    lastReps={prevLog?.reps}
                                    disabled={!activeSession}
                                  />
                                ))}
                              </div>

                              {/* Vídeo inline */}
                              {videoOpen && ytId && (
                                <div className="mt-3 rounded-xl overflow-hidden aspect-video bg-black">
                                  <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&autoplay=1`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={ex.exercise_name} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {blocks.length === 0 && (
              <Card className="bg-card border-border"><CardContent className="py-12 text-center"><Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhum exercício cadastrado</p></CardContent></Card>
            )}
          </div>
        )}
      </MobileContent>

      {/* Footer */}
      {!loading && !error && !isExpired && blocks.length > 0 && (
        <MobileFooter>
          {!activeSession ? (
            <Button variant="premium" size="xl" className="w-full gap-2" onClick={handleStart} disabled={starting}>
              {starting ? <><Loader2 className="h-5 w-5 animate-spin" />Iniciando...</> : <><Play className="h-5 w-5" />Iniciar Treino</>}
            </Button>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              {totalSets > 0 && (
                <div className="flex items-center gap-2 px-1">
                  <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">{doneSets}/{totalSets}</span>
                </div>
              )}
              <Button variant="premium" size="xl" className="w-full gap-2" onClick={() => setShowFinishModal(true)} disabled={doneSets === 0}>
                <CheckCircle2 className="h-5 w-5" />
                {doneSets === 0 ? "Marque séries para finalizar" : progressPct === 100 ? "Finalizar Treino ✓" : `Finalizar (${doneSets}/${totalSets})`}
              </Button>
            </div>
          )}
        </MobileFooter>
      )}

      {/* Modais */}
      {detailExercise && <ExerciseDetailModal exercise={detailExercise} onClose={() => setDetailExercise(null)} />}
      {showPdfModal && workout?.pdf_url && <PdfModal url={workout.pdf_url} onClose={() => setShowPdfModal(false)} />}

      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="bg-card border-border w-full max-w-sm"><CardContent className="p-6 space-y-4">
            <div className="text-center">
              <div className={cn("h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3 border", progressPct===100 ? "bg-green-500/10 border-green-500/20" : "bg-primary/10 border-primary/20")}>
                <Trophy className={cn("h-8 w-8", progressPct===100 ? "text-green-400" : "text-primary")} />
              </div>
              <h3 className="text-lg font-bold">{progressPct===100 ? "Treino Concluído! 🏆" : "Finalizar Treino?"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{progressPct===100 ? "Parabéns! Você completou todas as séries." : `${doneSets} de ${totalSets} séries concluídas (${progressPct}%).`}</p>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full", progressPct===100 ? "bg-green-400" : "bg-primary")} style={{ width: `${progressPct}%` }} />
            </div>
            {progressPct < 100 && <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl px-3 py-2.5 text-xs text-orange-400 text-center">⚠️ {totalSets - doneSets} série{totalSets-doneSets>1?"s":""} ainda não concluída{totalSets-doneSets>1?"s":""}.</div>}
            <div className="space-y-2">
              <Button variant="premium" className={cn("w-full", progressPct===100 && "bg-green-500 hover:bg-green-600 border-green-500")} onClick={handleFinish} disabled={finishing}>
                {finishing ? <><Loader2 className="h-4 w-4 animate-spin" />Finalizando...</> : <><CheckCircle2 className="h-4 w-4" />{progressPct===100 ? "Concluir Treino" : "Finalizar Mesmo Assim"}</>}
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowFinishModal(false)}>Continuar Treinando</Button>
            </div>
          </CardContent></Card>
        </div>
      )}
    </MobileContainer>
  );
};

export default StudentWorkoutPage;
