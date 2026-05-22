import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MobileContainer, MobileHeader, MobileContent, MobileFooter } from "@/components/layout/MobileContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  User, Dumbbell, LogOut, Loader2, ChevronLeft, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Repeat, Layers, Video, Play, RefreshCw, Trophy,
  AlertCircle, Lock, FileText, X, HelpCircle, Zap, Weight, StickyNote,
  Timer, History, BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { incrementJourneyProgress, getStudentJourneys } from "@/services/journeyService";

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
            {total > 1 && <div className="flex items-center gap-2 text-xs text-muted-foreground"><button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page<=1} className="px-2 py-1 rounded bg-muted disabled:opacity-40">‹</button>{page}/{total}<button onClick={() => setPage(p => Math.min(total,p+1))} disabled={page>=total} className="px-2 py-1 rounded bg-muted disabled:opacity-40">›</button></div>}
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
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => { if (prev <= 1) { clearInterval(interval); onDone?.(); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const pct = ((seconds - remaining) / seconds) * 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return (
    <div className="bg-primary/5 border border-primary/30 rounded-xl p-3 flex items-center gap-3 mb-3">
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
          <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
            strokeDasharray={`${2*Math.PI*16}`} strokeDashoffset={`${2*Math.PI*16*(1-pct/100)}`}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-bold text-primary">{mins>0?`${mins}:${String(secs).padStart(2,"0")}`:remaining}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold flex items-center gap-1"><Timer className="h-3 w-3 text-primary" />Descanso ativo</p>
        <p className="text-[10px] text-muted-foreground">Próxima série em {remaining}s</p>
      </div>
      <Button variant="ghost" size="sm" className="h-7 text-xs flex-shrink-0" onClick={onSkip}>Pular</Button>
    </div>
  );
};

// ── Modal histórico de carga ───────────────────────────────────
const LoadHistoryModal = ({ exerciseName, exerciseRowId, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("workout_exercise_logs")
          .select("actual_load, actual_reps, set_number, completed_at, session:workout_sessions(session_date)")
          .eq("exercise_row_id", exerciseRowId).eq("student_id", user.id)
          .order("completed_at", { ascending: false }).limit(30);
        setLogs(data ?? []);
      } catch { } finally { setLoading(false); }
    };
    load();
  }, [exerciseRowId, user.id]);
  const bySession = logs.reduce((acc, log) => {
    const date = log.session?.session_date ?? log.completed_at?.split("T")[0] ?? "—";
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-t-2xl w-full max-w-sm flex flex-col overflow-hidden" style={{ maxHeight: "70dvh" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div><p className="font-semibold text-sm">{exerciseName}</p><p className="text-xs text-muted-foreground">Histórico de cargas</p></div>
          <button className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
          {!loading && Object.keys(bySession).length === 0 && (
            <div className="text-center py-8 text-muted-foreground"><History className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Nenhum registro ainda</p></div>
          )}
          {!loading && Object.entries(bySession).map(([date, entries]) => (
            <div key={date}>
              <p className="text-xs font-medium text-muted-foreground mb-2">{new Date(date+"T12:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"})}</p>
              <div className="space-y-1">
                {entries.map((e, i) => (
                  <div key={i} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2">
                    <span className="text-xs text-muted-foreground">Série {e.set_number ?? i+1}</span>
                    <span className="text-sm font-medium">{e.actual_load ? `${e.actual_load}kg` : "—"}{e.actual_reps ? ` × ${e.actual_reps}` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Modal de registro de cargas ────────────────────────────────
const LoadTrackingModal = ({ exercise, sessionId, studentId, workoutId, restSeconds, onClose, onComplete }) => {
  const numSets = Number(exercise.sets) || 1;
  const [sets, setSets] = useState(Array.from({ length: numSets }, (_, i) => ({ num: i+1, kg: "", reps: "", done: false })));
  const [saving, setSaving] = useState(null);
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(restSeconds || 60);

  const handleSetDone = async (idx) => {
    if (!sessionId) { toast("Inicie o treino primeiro ⚡"); return; }
    setSaving(idx);
    try {
      const s = sets[idx];
      await supabase.from("workout_exercise_logs").upsert({
        session_id: sessionId,
        student_workout_id: workoutId,
        student_id: studentId,
        exercise_row_id: exercise.exercise_row_id,
        set_number: s.num,
        actual_load: s.kg ? String(s.kg) : null,
        actual_reps: s.reps ? Number(s.reps) : null,
        completed_at: new Date().toISOString(),
      }, { onConflict: "session_id,exercise_row_id,set_number" });
      setSets(prev => prev.map((x, i) => i === idx ? { ...x, done: true } : x));
      onComplete?.(exercise.exercise_row_id, s.num);
    } catch (err) { toast.error("Erro ao salvar"); console.error(err); }
    finally { setSaving(null); }
  };

  const allDone = sets.every(s => s.done);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-t-2xl w-full max-w-sm flex flex-col overflow-hidden" style={{ maxHeight: "85dvh" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div>
            <p className="font-semibold text-sm">{exercise.exercise_name}</p>
            <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
              {exercise.sets && <span>{exercise.sets} séries</span>}
              {exercise.reps && <span>· {exercise.reps} reps</span>}
              {exercise.load && <span>· {exercise.load}</span>}
            </div>
          </div>
          <button className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Timer no topo se ativo */}
          {showTimer && (
            <RestTimer
              seconds={timerSeconds}
              onDone={() => setShowTimer(false)}
              onSkip={() => setShowTimer(false)}
            />
          )}

          {/* Botão iniciar timer manual */}
          {!showTimer && (
            <button
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
              onClick={() => { setTimerSeconds(exercise.rest_seconds || restSeconds || 60); setShowTimer(true); }}
            >
              <Timer className="h-3.5 w-3.5" />
              Iniciar descanso ({exercise.rest_seconds || restSeconds || 60}s)
            </button>
          )}

          {/* Header colunas */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] text-muted-foreground w-6 text-center">#</span>
            <span className="text-[10px] text-muted-foreground flex-1 text-center">Carga (kg)</span>
            <span className="text-[10px] text-muted-foreground flex-1 text-center">Reps</span>
            <span className="text-[10px] text-muted-foreground w-9 text-center">✓</span>
          </div>

          {/* Séries */}
          {sets.map((s, idx) => (
            <div key={idx} className={cn("flex items-center gap-2 py-1 px-1 rounded-xl transition-all", s.done && "opacity-50 bg-green-500/5")}>
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border", s.done ? "bg-green-400 border-green-400 text-black" : "bg-muted border-border text-muted-foreground")}>
                {s.done ? "✓" : s.num}
              </div>
              <Input
                type="number"
                placeholder="kg"
                value={s.kg}
                onChange={e => setSets(prev => prev.map((x,i) => i===idx ? {...x, kg: e.target.value} : x))}
                disabled={s.done}
                className="h-8 text-sm text-center bg-secondary border-border flex-1 min-w-0"
              />
              <Input
                type="number"
                placeholder={exercise.reps ?? "reps"}
                value={s.reps}
                onChange={e => setSets(prev => prev.map((x,i) => i===idx ? {...x, reps: e.target.value} : x))}
                disabled={s.done}
                className="h-8 text-sm text-center bg-secondary border-border flex-1 min-w-0"
              />
              <Button
                size="sm"
                variant={s.done ? "ghost" : "outline"}
                className={cn("h-8 w-9 p-0 flex-shrink-0", s.done && "text-green-400")}
                onClick={() => handleSetDone(idx)}
                disabled={s.done || saving === idx}
              >
                {saving === idx ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex-shrink-0">
          {allDone ? (
            <Button className="w-full gap-2 bg-green-500 hover:bg-green-600" onClick={onClose}>
              <CheckCircle2 className="h-4 w-4" />Exercício concluído!
            </Button>
          ) : (
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>Fechar</Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Modal detalhes exercício ───────────────────────────────────
const ExerciseDetailModal = ({ exercise, onClose }) => {
  if (!exercise) return null;
  const ytId = getYoutubeId(exercise.video_url);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md p-0 sm:p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden flex flex-col shadow-2xl" style={{ maxHeight: "92dvh" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2"><p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Detalhes</p><h2 className="font-bold text-lg leading-tight">{exercise.exercise_name}</h2></div>
          <button className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {ytId && <div className="aspect-video bg-black w-full"><iframe src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={exercise.exercise_name} /></div>}
          <div className="px-5 py-5 flex flex-col gap-4">
            {(exercise.sets || exercise.reps || exercise.rest_seconds) && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">📋 Prescrição</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {exercise.sets && <div className="bg-background/40 rounded-xl py-3"><p className="text-2xl font-black text-primary">{exercise.sets}</p><p className="text-[10px] text-muted-foreground mt-1">séries</p></div>}
                  {exercise.reps && <div className="bg-background/40 rounded-xl py-3"><p className="text-2xl font-black">{exercise.reps}</p><p className="text-[10px] text-muted-foreground mt-1">reps</p></div>}
                  {exercise.rest_seconds && <div className="bg-background/40 rounded-xl py-3"><p className="text-2xl font-black">{exercise.rest_seconds}s</p><p className="text-[10px] text-muted-foreground mt-1">descanso</p></div>}
                </div>
              </div>
            )}
            {exercise.default_description && <p className="text-sm text-muted-foreground leading-relaxed">{exercise.default_description}</p>}
            {exercise.instructions && <div><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Como executar</p><div className="bg-muted/30 rounded-2xl p-4"><p className="text-sm leading-relaxed whitespace-pre-line">{exercise.instructions}</p></div></div>}
            {exercise.tips && <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3"><StickyNote className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" /><p className="text-sm leading-relaxed">{exercise.tips}</p></div>}
            {exercise.obs && <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex gap-3"><StickyNote className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" /><p className="text-sm">{exercise.obs}</p></div>}
          </div>
        </div>
        {exercise.video_url && <div className="px-5 py-4 border-t border-border flex-shrink-0"><a href={exercise.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm text-primary font-medium hover:underline"><Video className="h-4 w-4" />Abrir vídeo</a></div>}
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
  const [completedExercises, setCompletedExercises] = useState(new Set()); // exercícios marcados como "feito"
  const [completedSets, setCompletedSets]           = useState({});        // séries detalhadas
  const [expandedBlocks, setExpandedBlocks]         = useState(new Set());
  const [expandedVideos, setExpandedVideos]         = useState(new Set());
  const [activeSession, setActiveSession]           = useState(null);
  const [starting, setStarting]     = useState(false);
  const [finishing, setFinishing]   = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [isExpired, setIsExpired]   = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [detailExercise, setDetailExercise] = useState(null);
  const [historyExercise, setHistoryExercise] = useState(null);
  const [trackingExercise, setTrackingExercise] = useState(null); // modal de registro de carga
  const [lastLogs, setLastLogs]     = useState({});

  const loadWorkout = useCallback(async () => {
    if (!user || !workoutId) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const { data: sw, error: swErr } = await supabase.from("student_workouts").select("*").eq("id", workoutId).eq("student_id", user.id).single();
      if (swErr) throw swErr;
      let pdfUrl = sw.pdf_url || null;
      if (!pdfUrl && sw.template_id) {
        const { data: tmpl } = await supabase.from("workout_templates").select("pdf_url").eq("id", sw.template_id).maybeSingle();
        pdfUrl = tmpl?.pdf_url || null;
      }
      setWorkout({ ...sw, pdf_url: pdfUrl });
      const todayStr = new Date().toISOString().split("T")[0];
      if (sw.end_date && sw.end_date < todayStr) { setIsExpired(true); setLoading(false); return; }

      const { data: rows, error: viewErr } = await supabase.from("v_student_workout").select("*").eq("workout_id", workoutId).eq("student_id", user.id).order("block_order", { ascending: true }).order("exercise_order", { ascending: true });
      if (viewErr) throw viewErr;
      const { data: blockData } = await supabase.from("student_workout_blocks").select("id, block_type, order_index, rest_after_block_seconds").eq("student_workout_id", workoutId);
      const blockTypeMap = Object.fromEntries((blockData || []).map(b => [b.id, { type: b.block_type, rest: b.rest_after_block_seconds }]));
      const blockMap = {};
      for (const row of rows || []) {
        if (!blockMap[row.block_id]) blockMap[row.block_id] = { block_id: row.block_id, block_label: row.block_label, block_type: blockTypeMap[row.block_id]?.type || "normal", rest_seconds: blockTypeMap[row.block_id]?.rest || 60, block_order: row.block_order, exercises: [] };
        blockMap[row.block_id].exercises.push(row);
      }
      const sortedBlocks = Object.values(blockMap).sort((a, b) => a.block_order - b.block_order);
      setBlocks(sortedBlocks);
      if (sortedBlocks.length > 0) setExpandedBlocks(new Set([sortedBlocks[0].block_id]));

      const today = new Date().toISOString().split("T")[0];
      const { data: session } = await supabase.from("workout_sessions").select("*").eq("student_id", user.id).eq("workout_id", workoutId).eq("session_date", today).eq("finished", false).maybeSingle();
      if (session) {
        setActiveSession(session);
        const { data: logs } = await supabase.from("workout_exercise_logs").select("exercise_row_id, set_number, actual_load, actual_reps").eq("session_id", session.id);
        if (logs?.length) {
          const setsMap = {};
          const doneEx = new Set();
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

      const { data: lastSession } = await supabase.from("workout_sessions").select("id").eq("student_id", user.id).eq("workout_id", workoutId).eq("finished", true).order("session_date", { ascending: false }).limit(1).maybeSingle();
      if (lastSession) {
        const { data: prevLogs } = await supabase.from("workout_exercise_logs").select("exercise_row_id, actual_load, actual_reps").eq("session_id", lastSession.id);
        if (prevLogs?.length) {
          const prev = {};
          for (const log of prevLogs) { if (!prev[log.exercise_row_id]) prev[log.exercise_row_id] = { kg: log.actual_load, reps: log.actual_reps }; }
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

  const toggleBlock = blockId => { setExpandedBlocks(prev => { const next = new Set(prev); next.has(blockId) ? next.delete(blockId) : next.add(blockId); return next; }); };

  // Marcar exercício inteiro como feito (sem carga)
  const handleMarkExerciseDone = async (ex) => {
    if (!activeSession) { toast("Inicie o treino primeiro ⚡"); return; }
    const numSets = Number(ex.sets) || 1;
    try {
      const rows = Array.from({ length: numSets }, (_, i) => ({
        session_id: activeSession.id,
        student_workout_id: workoutId,
        student_id: user.id,
        exercise_row_id: ex.exercise_row_id,
        set_number: i + 1,
        completed_at: new Date().toISOString(),
      }));
      await supabase.from("workout_exercise_logs").upsert(rows, { onConflict: "session_id,exercise_row_id,set_number" });
      setCompletedExercises(prev => new Set([...prev, ex.exercise_row_id]));
      setCompletedSets(prev => {
        const next = { ...prev };
        next[ex.exercise_row_id] = new Set(Array.from({ length: numSets }, (_, i) => i + 1));
        return next;
      });
      toast.success("Exercício marcado! ✓");
    } catch (err) { toast.error("Erro: " + err.message); }
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
      const { data: todaySession } = await supabase.from("workout_sessions").select("*").eq("student_id", user.id).eq("workout_id", workoutId).eq("session_date", today).maybeSingle();
      if (todaySession) {
        if (todaySession.finished) { await supabase.from("workout_sessions").update({ status: "active", finished: false, started_at: new Date().toISOString() }).eq("id", todaySession.id); setActiveSession({ ...todaySession, status: "active", finished: false }); setCompletedSets({}); setCompletedExercises(new Set()); toast.success("Novo ciclo! 💪"); }
        else { setActiveSession(todaySession); toast.success("Treino retomado! 💪"); }
        return;
      }
      const { data: otherActive } = await supabase.from("workout_sessions").select("id").eq("student_id", user.id).eq("status", "active").maybeSingle();
      if (otherActive) await supabase.from("workout_sessions").update({ status: "finished", finished: true, finished_at: new Date().toISOString() }).eq("id", otherActive.id);
      await supabase.from("workout_sessions").insert({ student_id: user.id, workout_id: workoutId, session_date: today, started_at: new Date().toISOString(), status: "active", finished: false });
      const { data: newSession } = await supabase.from("workout_sessions").select("*").eq("student_id", user.id).eq("workout_id", workoutId).eq("session_date", today).maybeSingle();
      if (newSession) { setActiveSession(newSession); setCompletedSets({}); setCompletedExercises(new Set()); toast.success("Treino iniciado! 💪"); }
      else throw new Error("Sessão não encontrada.");
    } catch (err) { toast.error("Erro ao iniciar: " + err.message); }
    finally { setStarting(false); }
  };

  const handleFinish = async () => {
    if (!activeSession) return;
    setFinishing(true);
    try {
      await supabase.from("workout_sessions").update({ finished: true, status: "finished", finished_at: new Date().toISOString(), completed_at: new Date().toISOString() }).eq("id", activeSession.id);
      try { const sjs = await getStudentJourneys(user.id); const aj = sjs?.find(sj => sj.status === "active"); if (aj) await incrementJourneyProgress(user.id, aj.journey_id); } catch { }
      setActiveSession(null); setShowFinishModal(false);
      toast.success("Treino concluído! 🏆");
      navigate("/student");
    } catch (err) { toast.error("Erro ao finalizar: " + err.message); }
    finally { setFinishing(false); }
  };

  const isExerciseDone = (ex) => {
    const numSets = Number(ex.sets) || 1;
    return completedExercises.has(ex.exercise_row_id) || (completedSets[ex.exercise_row_id]?.size ?? 0) >= numSets;
  };
  const totalExercises = blocks.reduce((sum, b) => sum + b.exercises.length, 0);
  const doneExercises  = blocks.reduce((sum, b) => sum + b.exercises.filter(ex => isExerciseDone(ex)).length, 0);
  const progressPct    = totalExercises > 0 ? Math.round((doneExercises / totalExercises) * 100) : 0;
  const isBlockCompleted = b => b.exercises.every(ex => isExerciseDone(ex));

  return (
    <MobileContainer>
      <MobileHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/student")}><ChevronLeft className="h-5 w-5" /></Button>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20"><User className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="font-semibold text-sm">{profile?.name || "Aluno"}</p>
                <Badge variant={activeSession ? "premium" : "success"} className="text-[10px] mt-0.5">{activeSession ? "Treinando" : "Aluno"}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {workout?.pdf_url && <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowPdfModal(true)}><FileText className="h-4 w-4 text-primary" /></Button>}
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={loadWorkout}><RefreshCw className="h-4 w-4 text-muted-foreground" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={async () => { try { await logout(); } catch {} }}><LogOut className="h-4 w-4 text-muted-foreground" /></Button>
          </div>
        </div>
      </MobileHeader>

      <MobileContent className="pb-32">
        {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        : isExpired ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-5">
            <div className="h-24 w-24 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center"><Lock className="h-11 w-11 text-destructive/70" /></div>
            <div className="space-y-2"><h2 className="text-2xl font-bold">Treino Expirado</h2><p className="text-sm text-muted-foreground">{workout?.end_date ? `Expirou em ${new Date(workout.end_date+"T12:00:00").toLocaleDateString("pt-BR")}.` : "Não disponível."}</p></div>
            <Button variant="premium" className="w-full max-w-[260px] gap-2 py-6" onClick={() => window.open(`https://wa.me/5511949997913?text=${encodeURIComponent("Olá! Meu treino expirou. 🏋️")}`, "_blank")}>Falar com o Personal</Button>
            <Button variant="outline" onClick={() => navigate("/student")} className="w-full max-w-[260px]"><ChevronLeft className="h-4 w-4 mr-1" />Voltar</Button>
          </div>
        ) : error ? (
          <Card className="bg-card border-destructive/30 mt-4"><CardContent className="py-10 text-center"><AlertCircle className="h-10 w-10 mx-auto text-destructive mb-3" /><p className="text-destructive font-medium mb-4">{error}</p><Button variant="outline" size="sm" onClick={loadWorkout}><RefreshCw className="h-4 w-4 mr-2" />Tentar novamente</Button></CardContent></Card>
        ) : (
          <div className="space-y-4 pt-3">
            <div>
              <Badge variant="premium" className="text-xs mb-2">Treino Atual</Badge>
              <h1 className="text-2xl font-bold leading-tight">{workout?.title || "Treino"}</h1>
              <p className="text-sm text-muted-foreground mt-1">{blocks.length} blocos · {totalExercises} exercícios</p>
            </div>

            {activeSession && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Progresso</span><span className="font-bold">{doneExercises}/{totalExercises} exercícios</span></div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden"><div className={cn("h-full rounded-full transition-all", progressPct===100?"bg-green-400":"bg-primary")} style={{ width: `${progressPct}%` }} /></div>
                {progressPct===100 && <p className="text-xs text-center text-green-400 font-semibold">🏆 Todos os exercícios concluídos!</p>}
              </div>
            )}

            <div className="space-y-3">
              {blocks.map(block => {
                const isExpanded = expandedBlocks.has(block.block_id);
                const blockDone = isBlockCompleted(block);
                const typeCfg = blockTypeConfig[block.block_type] || blockTypeConfig.normal;
                return (
                  <Card key={block.block_id} className={cn("border overflow-hidden rounded-2xl", blockDone ? "bg-green-500/5 border-green-500/30" : "bg-card border-border")}>
                    <div className="flex items-center justify-between px-4 py-4 cursor-pointer" onClick={() => toggleBlock(block.block_id)}>
                      <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border flex-shrink-0", blockDone ? "bg-green-500/10 border-green-500/30" : "bg-primary/10 border-primary/20")}>
                          {blockDone ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Layers className="h-4 w-4 text-primary" />}
                        </div>
                        <div>
                          <p className={cn("font-semibold text-base", blockDone ? "text-green-400" : "text-foreground")}>{block.block_label || `Bloco ${String.fromCharCode(64+(blocks.indexOf(block)+1))}`}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border", typeCfg.color)}>{typeCfg.label}</span>
                            <span className="text-[10px] text-muted-foreground">{block.exercises.length} exerc.</span>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border divide-y divide-border/50">
                        {block.exercises.map((ex, idx) => {
                          const exDone = isExerciseDone(ex);
                          const prevLog = lastLogs[ex.exercise_row_id];
                          const ytId = getYoutubeId(ex.video_url);
                          return (
                            <div key={ex.exercise_row_id || idx} className={cn("px-4 py-4 transition-colors", exDone && "bg-green-500/5")}>
                              {/* Nome + status */}
                              <div className="flex items-start gap-3">
                                {/* Check circular */}
                                <div className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all cursor-pointer", exDone ? "border-green-400 bg-green-400" : "border-muted-foreground/40 hover:border-primary/60")}
                                  onClick={() => !exDone && handleMarkExerciseDone(ex)}>
                                  {exDone && <CheckCircle2 className="h-4 w-4 text-white" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className={cn("font-semibold text-sm leading-tight", exDone ? "text-green-400 line-through" : "text-foreground")}>{ex.exercise_name}</p>
                                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                    {ex.sets && <span>{ex.sets} séries</span>}
                                    {ex.reps && <span>· {ex.reps} reps</span>}
                                    {ex.rest_seconds && <span>· {ex.rest_seconds}s descanso</span>}
                                    {ex.load && <span>· {ex.load}</span>}
                                  </div>
                                  {prevLog?.kg && (
                                    <p className="text-[10px] text-muted-foreground mt-1">Última: {prevLog.kg}kg × {prevLog.reps || "?"}</p>
                                  )}
                                </div>

                                {/* Botões de ação */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {ytId && (
                                    <button className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                                      onClick={() => setExpandedVideos(prev => { const next = new Set(prev); next.has(ex.exercise_row_id) ? next.delete(ex.exercise_row_id) : next.add(ex.exercise_row_id); return next; })}>
                                      <Play className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                                    onClick={() => setHistoryExercise({ name: ex.exercise_name, rowId: ex.exercise_row_id })}>
                                    <History className="h-3.5 w-3.5" />
                                  </button>
                                  <button className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                                    onClick={() => setDetailExercise(ex)}>
                                    <HelpCircle className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Obs */}
                              {ex.obs && <div className="flex items-start gap-1.5 mt-2 ml-10"><StickyNote className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" /><p className="text-xs text-muted-foreground">{ex.obs}</p></div>}

                              {/* Botão registrar carga */}
                              {!exDone && (
                                <div className="mt-3 ml-10">
                                  <button
                                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                                    onClick={() => setTrackingExercise(ex)}
                                  >
                                    <BarChart2 className="h-3.5 w-3.5" />
                                    Registrar cargas por série
                                  </button>
                                </div>
                              )}

                              {/* Vídeo inline */}
                              {expandedVideos.has(ex.exercise_row_id) && ytId && (
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
            {blocks.length === 0 && <Card className="bg-card border-border"><CardContent className="py-12 text-center"><Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhum exercício cadastrado</p></CardContent></Card>}
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
              {totalExercises > 0 && (
                <div className="flex items-center gap-2 px-1">
                  <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} /></div>
                  <span className="text-xs text-muted-foreground tabular-nums">{doneExercises}/{totalExercises}</span>
                </div>
              )}
              <Button variant="premium" size="xl" className="w-full gap-2" onClick={() => setShowFinishModal(true)} disabled={doneExercises===0}>
                <CheckCircle2 className="h-5 w-5" />
                {doneExercises===0 ? "Marque exercícios para finalizar" : progressPct===100 ? "Finalizar Treino ✓" : `Finalizar (${doneExercises}/${totalExercises})`}
              </Button>
            </div>
          )}
        </MobileFooter>
      )}

      {/* Modais */}
      {detailExercise && <ExerciseDetailModal exercise={detailExercise} onClose={() => setDetailExercise(null)} />}
      {showPdfModal && workout?.pdf_url && <PdfModal url={workout.pdf_url} onClose={() => setShowPdfModal(false)} />}
      {historyExercise && <LoadHistoryModal exerciseName={historyExercise.name} exerciseRowId={historyExercise.rowId} onClose={() => setHistoryExercise(null)} />}
      {trackingExercise && (
        <LoadTrackingModal
          exercise={trackingExercise}
          sessionId={activeSession?.id}
          studentId={user?.id}
          workoutId={workoutId}
          restSeconds={trackingExercise.rest_seconds || 60}
          onClose={() => setTrackingExercise(null)}
          onComplete={(rowId, setNum) => {
            handleSetComplete(rowId, setNum);
            const numSets = Number(trackingExercise.sets) || 1;
            setCompletedSets(prev => {
              const next = { ...prev };
              if (!next[rowId]) next[rowId] = new Set();
              const updated = new Set([...next[rowId], setNum]);
              if (updated.size >= numSets) setCompletedExercises(p => new Set([...p, rowId]));
              next[rowId] = updated;
              return next;
            });
          }}
        />
      )}

      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="bg-card border-border w-full max-w-sm"><CardContent className="p-6 space-y-4">
            <div className="text-center">
              <div className={cn("h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3 border", progressPct===100?"bg-green-500/10 border-green-500/20":"bg-primary/10 border-primary/20")}>
                <Trophy className={cn("h-8 w-8", progressPct===100?"text-green-400":"text-primary")} />
              </div>
              <h3 className="text-lg font-bold">{progressPct===100?"Treino Concluído! 🏆":"Finalizar Treino?"}</h3>
              <p className="text-sm text-muted-foreground mt-1">{progressPct===100?"Parabéns! Todos os exercícios concluídos.":`${doneExercises} de ${totalExercises} exercícios (${progressPct}%).`}</p>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden"><div className={cn("h-full rounded-full", progressPct===100?"bg-green-400":"bg-primary")} style={{ width: `${progressPct}%` }} /></div>
            {progressPct < 100 && <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl px-3 py-2.5 text-xs text-orange-400 text-center">⚠️ {totalExercises-doneExercises} exercício{totalExercises-doneExercises>1?"s":""} ainda não concluído{totalExercises-doneExercises>1?"s":""}.</div>}
            <div className="space-y-2">
              <Button variant="premium" className={cn("w-full", progressPct===100&&"bg-green-500 hover:bg-green-600 border-green-500")} onClick={handleFinish} disabled={finishing}>
                {finishing?<><Loader2 className="h-4 w-4 animate-spin" />Finalizando...</>:<><CheckCircle2 className="h-4 w-4" />{progressPct===100?"Concluir Treino":"Finalizar Mesmo Assim"}</>}
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
