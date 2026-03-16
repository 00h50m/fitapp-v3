import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  MobileContainer, MobileHeader, MobileContent, MobileFooter,
} from "@/components/layout/MobileContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  User, Dumbbell, LogOut, Loader2, ChevronLeft,
  ChevronDown, ChevronUp, CheckCircle2,
  Clock, Repeat, Layers, Video, Play, RefreshCw,
  Trophy, AlertCircle, Lock, FileText, X,
  HelpCircle, Zap, Weight, Info, StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const blockTypeConfig = {
  normal:   { label: "Normal",    color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  single:   { label: "Simples",   color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  biset:    { label: "Biset",     color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  triset:   { label: "Triset",    color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  circuit:  { label: "Circuito",  color: "bg-green-500/15 text-green-400 border-green-500/30" },
  dropset:  { label: "Drop Set",  color: "bg-red-500/15 text-red-400 border-red-500/30" },
  giantset: { label: "Giant Set", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
};

// Extrai ID do YouTube de qualquer formato de URL
function getYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}


// ─── PDF Viewer via PDF.js ─────────────────────────────────────────────────
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
    loadPdfJs()
      .then(lib => lib.getDocument({ url, withCredentials: false }).promise)
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/90 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}>
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl flex flex-col overflow-hidden"
        style={{ height: "92dvh" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">PDF do Treino</span>
          </div>
          <div className="flex items-center gap-3">
            {total > 1 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1} className="px-2 py-1 rounded bg-muted disabled:opacity-40">‹</button>
                {page}/{total}
                <button onClick={() => setPage(p => Math.min(total, p+1))} disabled={page >= total} className="px-2 py-1 rounded bg-muted disabled:opacity-40">›</button>
              </div>
            )}
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Abrir</a>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-3 bg-muted/20">
          {pdfLoading && <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {pdfError && (
            <div className="flex flex-col items-center py-16 gap-3">
              <p className="text-sm text-muted-foreground">Não foi possível carregar o PDF inline.</p>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">Abrir em nova aba</Button>
              </a>
            </div>
          )}
          {!pdfLoading && !pdfError && <canvas ref={canvasRef} className="shadow-lg max-w-full rounded" />}
        </div>
      </div>
    </div>
  );
};


// Mapeamentos PT-BR para o modal de detalhes
const MUSCLE_LABELS = {
  chest:"Peitoral",back:"Costas",shoulders:"Ombros",biceps:"Bíceps",
  triceps:"Tríceps",forearms:"Antebraço",core:"Core/Abdômen",glutes:"Glúteos",
  quads:"Quadríceps",hamstrings:"Post. Coxa",adductors:"Adutores",
  calves:"Panturrilha",full_body:"Corpo Inteiro",cardio:"Cardio",legs:"Pernas",
};
const EQUIP_LABELS = {
  barbell:"Barra",dumbbell:"Halteres",cable:"Cabo/Polia",machine:"Máquina",
  bodyweight:"Peso Corporal",kettlebell:"Kettlebell",band:"Elástico",
  smith:"Smith",trap_bar:"Trap Bar",bench:"Banco",other:"Outro",
};
const DIFF_LABELS = {
  beginner:"Iniciante",intermediate:"Intermediário",advanced:"Avançado",
};
const CAT_LABELS = {
  strength:"Força",hypertrophy:"Hipertrofia",endurance:"Resistência",
  power:"Potência",mobility:"Mobilidade",cardio:"Cardio",
};
const MECH_LABELS = { compound:"Composto",isolation:"Isolado" };
const FORCE_LABELS = {
  push:"Empurrar",pull:"Puxar",legs:"Pernas",core:"Core",
  rotation:"Rotação",stabilization:"Estabilização",
};
const label = (map, val) => (val ? (map[val] || val) : null);

// ─── Modal de detalhes do exercício ───────────────────────────────────────
const ExerciseDetailModal = ({ exercise, onClose }) => {
  if (!exercise) return null;
  const ytId = getYoutubeId(exercise.video_url);

  // Chip de info pequeno
  const Chip = ({ icon: Icon, label, value, accent }) => (
    <div className={cn(
      "flex items-center gap-2 rounded-xl p-3",
      accent ? "bg-primary/10 border border-primary/20" : "bg-muted/60 border border-border/40"
    )}>
      <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", accent ? "text-primary" : "text-muted-foreground")} />
      <div className="min-w-0">
        <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none mb-1">{label}</p>
        <p className={cn("text-xs font-bold leading-none truncate", accent ? "text-primary" : "text-foreground")}>{value}</p>
      </div>
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
        <div className="flex-1 h-px bg-border/50" />
      </div>
      <div>{children}</div>
    </div>
  );

  const hasPrescricao = exercise.sets || exercise.reps || exercise.rest_seconds || exercise.load || exercise.tempo;
  const hasInfo = exercise.muscle_group || exercise.equipment || exercise.difficulty || exercise.category || exercise.mechanics || exercise.force;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden flex flex-col shadow-2xl"
        style={{ maxHeight: "92dvh", minHeight: "200px" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Detalhes do Exercício</p>
            <h2 className="font-bold text-lg text-foreground leading-tight">{exercise.exercise_name}</h2>
          </div>
          <button className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corpo scrollável */}
        <div className="flex-1 overflow-y-auto">

          {/* Vídeo full width */}
          {ytId && (
            <div className="aspect-video bg-black w-full">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen title={exercise.exercise_name}
              />
            </div>
          )}

          <div className="px-5 py-6 flex flex-col gap-5">

            {/* PRESCRIÇÃO */}
            {hasPrescricao && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">📋 Prescrição</p>
                <div className="grid grid-cols-3 gap-2">
                  {exercise.sets && (
                    <div className="text-center bg-background/40 rounded-xl py-3">
                      <p className="text-3xl font-black text-primary leading-none">{exercise.sets}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wide">séries</p>
                    </div>
                  )}
                  {exercise.reps && (
                    <div className="text-center bg-background/40 rounded-xl py-3">
                      <p className="text-3xl font-black text-foreground leading-none">{exercise.reps}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wide">reps</p>
                    </div>
                  )}
                  {exercise.rest_seconds && (
                    <div className="text-center bg-background/40 rounded-xl py-3">
                      <p className="text-3xl font-black text-foreground leading-none">
                        {exercise.rest_seconds}<span className="text-lg font-bold">s</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wide">descanso</p>
                    </div>
                  )}
                </div>
                {(exercise.load || exercise.tempo) && (
                  <div className={cn(
                    "gap-2 mt-3 pt-3 border-t border-primary/15",
                    exercise.load && exercise.tempo ? "grid grid-cols-2" : "flex"
                  )}>
                    {exercise.load  && <Chip icon={Weight} label="Carga sugerida" value={exercise.load}  accent />}
                    {exercise.tempo && <Chip icon={Zap}    label="Tempo"          value={exercise.tempo} accent />}
                  </div>
                )}
              </div>
            )}

            {/* Informações do exercício */}
            {(exercise.muscle_group || exercise.equipment || exercise.difficulty) && (
              <div className="grid grid-cols-3 gap-2">
                {exercise.muscle_group && <Chip icon={Dumbbell} label="Músculo"     value={label(MUSCLE_LABELS, exercise.muscle_group)} />}
                {exercise.equipment    && <Chip icon={Layers}   label="Equipamento" value={label(EQUIP_LABELS, exercise.equipment)} />}
                {exercise.difficulty   && <Chip icon={Zap}      label="Nível"       value={label(DIFF_LABELS, exercise.difficulty)} />}
              </div>
            )}

            {/* Músculos secundários */}
            {exercise.secondary_muscles?.length > 0 && (
              <Section title="Músculos secundários">
                <div className="flex flex-wrap gap-2 mt-1">
                  {(Array.isArray(exercise.secondary_muscles) ? exercise.secondary_muscles : [exercise.secondary_muscles])
                    .map((m, i) => (
                      <span key={i} className="text-xs bg-muted/80 border border-border text-muted-foreground px-3 py-1.5 rounded-full">{label(MUSCLE_LABELS, m) || m}</span>
                    ))}
                </div>
              </Section>
            )}

            {/* Info extra */}
            {(exercise.category || exercise.mechanics || exercise.force) && (
              <div className="grid grid-cols-3 gap-2 -mt-1">
                {exercise.category  && <Chip icon={Info}   label="Categoria" value={label(CAT_LABELS, exercise.category)} />}
                {exercise.mechanics && <Chip icon={Repeat} label="Mecânica"  value={label(MECH_LABELS, exercise.mechanics)} />}
                {exercise.force     && <Chip icon={Weight} label="Força"     value={label(FORCE_LABELS, exercise.force)} />}
              </div>
            )}

            {/* Descrição */}
            {exercise.default_description && (
              <Section title="Descrição">
                <p className="text-sm text-muted-foreground leading-relaxed">{exercise.default_description}</p>
              </Section>
            )}

            {/* Execução */}
            {exercise.instructions && (
              <Section title="Como executar">
                <div className="bg-muted/30 rounded-2xl p-4 space-y-0">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line" style={{lineHeight:"1.8"}}>{exercise.instructions}</p>
                </div>
              </Section>
            )}

            {/* Dicas */}
            {exercise.tips && (
              <Section title="Dicas do treinador">
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
                  <StickyNote className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground leading-relaxed" style={{lineHeight:"1.8"}}>{exercise.tips}</p>
                </div>
              </Section>
            )}

            {/* Observações */}
            {exercise.obs && (
              <Section title="Obs. do treino">
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
                  <StickyNote className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground leading-relaxed">{exercise.obs}</p>
                </div>
              </Section>
            )}

            {/* Tags */}
            {exercise.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {exercise.tags.map((tag, i) => (
                  <span key={i} className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full border border-border">{tag}</span>
                ))}
              </div>
            )}

            {!ytId && !hasPrescricao && !hasInfo && !exercise.instructions && !exercise.tips && !exercise.obs && (
              <div className="text-center py-10 text-muted-foreground text-sm">Nenhum detalhe cadastrado.</div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        {exercise.video_url && (
          <div className="px-5 py-4 border-t border-border flex-shrink-0 bg-card/80">
            <a href={exercise.video_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-primary font-medium hover:underline">
              <Video className="h-4 w-4" />
              Abrir vídeo em nova aba
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Componente principal ──────────────────────────────────────────────────
const StudentWorkoutPage = () => {
  const { id: workoutId } = useParams();
  const navigate = useNavigate();
  const { user, profile, logout, loading: authLoading } = useAuth();

  const [workout, setWorkout] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [expandedBlocks, setExpandedBlocks] = useState(new Set());
  const [expandedVideos, setExpandedVideos] = useState(new Set()); // vídeos inline abertos
  const [activeSession, setActiveSession] = useState(null);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [detailExercise, setDetailExercise] = useState(null); // modal detalhes

  const loadWorkout = useCallback(async () => {
    if (!user || !workoutId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data: sw, error: swErr } = await supabase
        .from("student_workouts")
        .select("*")
        .eq("id", workoutId)
        .eq("student_id", user.id)
        .single();
      if (swErr) throw swErr;

      // Busca pdf_url do template se não tiver no student_workout
      let pdfUrl = sw.pdf_url || null;
      if (!pdfUrl && sw.template_id) {
        const { data: tmpl } = await supabase
          .from("workout_templates")
          .select("pdf_url")
          .eq("id", sw.template_id)
          .maybeSingle();
        pdfUrl = tmpl?.pdf_url || null;
      }
      setWorkout({ ...sw, pdf_url: pdfUrl });

      // Verificar expiração pelo campo end_date (não expires_at)
      const todayStr = new Date().toISOString().split("T")[0];
      if (sw.end_date && sw.end_date < todayStr) {
        setIsExpired(true);
        setLoading(false);
        return;
      }

      const { data: rows, error: viewErr } = await supabase
        .from("v_student_workout")
        .select("*")
        .eq("workout_id", workoutId)
        .eq("student_id", user.id)
        .order("block_order", { ascending: true })
        .order("exercise_order", { ascending: true });
      if (viewErr) throw viewErr;

      const { data: blockData } = await supabase
        .from("student_workout_blocks")
        .select("id, block_type, order_index")
        .eq("student_workout_id", workoutId);
      const blockTypeMap = Object.fromEntries(
        (blockData || []).map(b => [b.id, b.block_type])
      );

      const blockMap = {};
      for (const row of rows || []) {
        const key = row.block_id;
        if (!blockMap[key]) {
          blockMap[key] = {
            block_id: row.block_id,
            block_label: row.block_label,
            block_type: blockTypeMap[row.block_id] || "normal",
            block_order: row.block_order,
            exercises: [],
          };
        }
        blockMap[key].exercises.push(row);
      }
      const sortedBlocks = Object.values(blockMap).sort((a, b) => a.block_order - b.block_order);
      setBlocks(sortedBlocks);
      if (sortedBlocks.length > 0) {
        setExpandedBlocks(new Set([sortedBlocks[0].block_id]));
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: session } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("student_id", user.id)
        .eq("workout_id", workoutId)
        .eq("session_date", today)
        .eq("finished", false)
        .maybeSingle();
      if (session) {
        setActiveSession(session);
        const { data: logs } = await supabase
          .from("workout_exercise_logs")
          .select("exercise_row_id")
          .eq("session_id", session.id)
          ;
        if (logs?.length) {
          setCompletedExercises(new Set(logs.map(l => l.exercise_row_id)));
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  const toggleVideo = (exerciseRowId, e) => {
    e.stopPropagation();
    setExpandedVideos(prev => {
      const next = new Set(prev);
      next.has(exerciseRowId) ? next.delete(exerciseRowId) : next.add(exerciseRowId);
      return next;
    });
  };

  const toggleExercise = async (exerciseId) => {
    if (!activeSession) {
      toast("Inicie o treino primeiro ⚡");
      return;
    }
    const isDone = completedExercises.has(exerciseId);
    setCompletedExercises(prev => {
      const next = new Set(prev);
      isDone ? next.delete(exerciseId) : next.add(exerciseId);
      return next;
    });
    try {
      if (isDone) {
        await supabase.from("workout_exercise_logs").delete()
          .eq("session_id", activeSession.id)
          .eq("exercise_row_id", exerciseId);
      } else {
        // Tenta insert; se ja existe (unique), ignora
        const { error: logErr } = await supabase
          .from("workout_exercise_logs")
          .insert({
            session_id: activeSession.id,
            student_workout_id: workout?.id ?? null,
            student_id: user.id,
            exercise_row_id: exerciseId,
            completed_at: new Date().toISOString(),
          });
        if (logErr && logErr.code !== "23505") throw logErr;
      }
    } catch {
      setCompletedExercises(prev => {
        const next = new Set(prev);
        isDone ? next.add(exerciseId) : next.delete(exerciseId);
        return next;
      });
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // Constraint: UNIQUE (student_id, workout_id, session_date)
      // Só pode existir 1 sessão por aluno/treino/dia — nunca cria duplicata

      // 1. Verifica se já existe sessão hoje para este treino (qualquer status)
      const { data: todaySession } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("student_id", user.id)
        .eq("workout_id", workoutId)
        .eq("session_date", today)
        .maybeSingle();

      if (todaySession) {
        // Já existe — reativa se estava finalizada (novo ciclo no mesmo dia)
        if (todaySession.status !== "active" || todaySession.finished) {
          await supabase
            .from("workout_sessions")
            .update({ status: "active", finished: false, started_at: new Date().toISOString() })
            .eq("id", todaySession.id);
          setActiveSession({ ...todaySession, status: "active", finished: false });
          setCompletedExercises(new Set());
          toast.success("Novo ciclo iniciado! 💪");
        } else {
          // Já estava ativa — retoma
          setActiveSession(todaySession);
          toast.success("Treino retomado! 💪");
        }
        return;
      }

      // 2. Verifica se há outra sessão ativa (outro treino) e finaliza
      const { data: otherActive } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("student_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (otherActive) {
        await supabase
          .from("workout_sessions")
          .update({ status: "finished", finished: true, finished_at: new Date().toISOString(), completed_at: new Date().toISOString() })
          .eq("id", otherActive.id);
      }

      // 3. Cria nova sessão
      const { error: insertErr } = await supabase
        .from("workout_sessions")
        .insert({
          student_id: user.id,
          workout_id: workoutId,
          session_date: today,
          started_at: new Date().toISOString(),
          status: "active",
          finished: false,
        });

      if (insertErr) throw insertErr;

      // 4. Busca a sessão criada
      const { data: newSession } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("student_id", user.id)
        .eq("workout_id", workoutId)
        .eq("session_date", today)
        .maybeSingle();

      if (newSession) {
        setActiveSession(newSession);
        setCompletedExercises(new Set());
        toast.success("Treino iniciado! 💪");
      } else {
        throw new Error("Sessão criada mas não encontrada.");
      }
    } catch (err) {
      toast.error("Erro ao iniciar: " + err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleFinish = async () => {
    if (!activeSession) return;
    setFinishing(true);
    try {
      await supabase.from("workout_sessions").update({
        finished: true, status: "finished",
        finished_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }).eq("id", activeSession.id);
      setActiveSession(null);
      setShowFinishModal(false);
      toast.success("Treino concluído! 🏆");
      navigate("/student/workouts");
    } catch (err) {
      toast.error("Erro ao finalizar: " + err.message);
    } finally {
      setFinishing(false);
    }
  };

  const totalExercises = blocks.reduce((sum, b) => sum + b.exercises.length, 0);
  const completedCount = completedExercises.size;
  const progressPct = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;
  const isBlockCompleted = b => b.exercises.length > 0 && b.exercises.every(ex => completedExercises.has(ex.exercise_row_id));

  return (
    <MobileContainer>
      <MobileHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/student/workouts")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{profile?.name || "Aluno"}</p>
                <Badge variant={activeSession ? "premium" : "success"} className="text-[10px] mt-0.5">
                  {activeSession ? "Treinando" : "Aluno"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={loadWorkout}>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={async () => { try { await logout(); } catch {} }}>
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </MobileHeader>

      <MobileContent className="pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>

        ) : isExpired ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-5 animate-fade-in">
            <div className="h-24 w-24 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <Lock className="h-11 w-11 text-destructive/70" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold text-foreground">Treino Expirado</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {workout?.end_date
                  ? `Este treino expirou em ${new Date(workout.end_date + "T12:00:00").toLocaleDateString("pt-BR")}.`
                  : "Este treino não está mais disponível."}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Entre em contato com seu personal trainer para renovar o acesso e voltar a treinar! 💪
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-[260px]">
              <Button
                variant="premium"
                className="w-full gap-2 py-6 text-base"
                onClick={() => {
                  const msg = encodeURIComponent("Olá! Meu treino expirou e gostaria de renovar. 🏋️");
                  window.open(`https://wa.me/5511949997913?text=${msg}`, "_blank");
                }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Falar com o Personal
              </Button>
              <Button variant="outline" onClick={() => navigate("/student/workouts")} className="w-full gap-2">
                <ChevronLeft className="h-4 w-4" />Voltar para Meus Treinos
              </Button>
            </div>
          </div>

        ) : error ? (
          <Card className="bg-card border-destructive/30 mt-4">
            <CardContent className="py-10 text-center">
              <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
              <p className="text-destructive font-medium mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={loadWorkout}>
                <RefreshCw className="h-4 w-4 mr-2" />Tentar novamente
              </Button>
            </CardContent>
          </Card>

        ) : (
          <div className="space-y-5 animate-fade-in pt-3">

            {/* Header do treino */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Badge variant="premium" className="text-xs mb-2">Treino Atual</Badge>
                <h1 className="text-2xl font-display font-bold text-foreground leading-tight">{workout?.title || "Treino"}</h1>
                <p className="text-sm text-muted-foreground mt-1.5">{blocks.length} blocos • {totalExercises} exercícios</p>
              </div>
              {workout?.pdf_url && (
                <button
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex-shrink-0 hover:bg-primary/20 transition-colors"
                  onClick={() => setShowPdfModal(true)}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Ver PDF
                </button>
              )}
            </div>

            {/* Barra de progresso */}
            {activeSession && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Progresso da sessão</span>
                  <span className="font-bold text-foreground">{completedCount}/{totalExercises}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className={cn(
                    "h-full rounded-full transition-all duration-500",
                    progressPct === 100 ? "bg-green-400" : "bg-primary"
                  )} style={{ width: `${progressPct}%` }} />
                </div>
                {progressPct === 100 && (
                  <p className="text-xs text-center text-green-400 font-semibold">🏆 Todos os exercícios concluídos!</p>
                )}
              </div>
            )}

            {/* Blocos */}
            <div className="space-y-4">
              {blocks.map(block => {
                const isExpanded = expandedBlocks.has(block.block_id);
                const blockDone = isBlockCompleted(block);
                const typeCfg = blockTypeConfig[block.block_type] || blockTypeConfig.normal;

                return (
                  <Card key={block.block_id} className={cn(
                    "border transition-all duration-200 overflow-hidden rounded-2xl",
                    blockDone
                      ? "bg-green-500/5 border-green-500/30"
                      : "bg-card border-border shadow-sm"
                  )}>
                    {/* Header do bloco */}
                    <div
                      className="flex items-center justify-between px-4 py-4 cursor-pointer select-none"
                      onClick={() => toggleBlock(block.block_id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center border flex-shrink-0",
                          blockDone ? "bg-green-500/10 border-green-500/30" : "bg-primary/10 border-primary/20"
                        )}>
                          {blockDone
                            ? <CheckCircle2 className="h-5 w-5 text-green-400" />
                            : <Layers className="h-4 w-4 text-primary" />}
                        </div>
                        <div>
                          <p className={cn("font-semibold text-base", blockDone ? "text-green-400" : "text-foreground")}>
                            {block.block_label || `Bloco ${String.fromCharCode(64 + (blocks.indexOf(block) + 1))}`}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border", typeCfg.color)}>
                              {typeCfg.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{block.exercises.length} exerc.</span>
                            {blockDone && <span className="text-[10px] text-green-400 font-medium">✓ Completo</span>}
                          </div>
                        </div>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                    </div>

                    {/* Lista de exercícios */}
                    {isExpanded && (
                      <div className="border-t border-border divide-y divide-border/50">
                        {block.exercises.map((ex, idx) => {
                          const done = completedExercises.has(ex.exercise_row_id);
                          const ytId = getYoutubeId(ex.video_url);
                          const videoKey = ex.exercise_row_id || `${block.block_id}-${idx}`;
                          const videoOpen = expandedVideos.has(videoKey);

                          return (
                            <div key={videoKey}>
                              {/* Linha principal do exercício */}
                              <div
                                className={cn(
                                  "px-4 py-4 transition-colors duration-150 cursor-pointer",
                                  done ? "bg-green-500/8" : "hover:bg-muted/20"
                                )}
                                onClick={() => toggleExercise(ex.exercise_row_id)}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Checkbox */}
                                  <div className={cn(
                                    "h-7 w-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                                    done ? "border-green-400 bg-green-400" : "border-muted-foreground/40"
                                  )}>
                                    {done && <CheckCircle2 className="h-4 w-4 text-white" />}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    {/* Nome + botões */}
                                    <div className="flex items-center justify-between gap-2">
                                      <p className={cn(
                                        "font-semibold text-base leading-tight",
                                        done ? "text-green-400 line-through" : "text-foreground"
                                      )}>
                                        {ex.exercise_name}
                                      </p>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        {/* Botão vídeo inline */}
                                        {ytId && (
                                          <button
                                            className={cn(
                                              "h-8 w-8 rounded-xl flex items-center justify-center transition-colors",
                                              videoOpen
                                                ? "bg-primary/20 text-primary"
                                                : "bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10"
                                            )}
                                            onClick={e => toggleVideo(videoKey, e)}
                                            title="Ver vídeo"
                                          >
                                            <Play className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                        {/* Botão detalhes */}
                                        <button
                                          className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                          onClick={e => { e.stopPropagation(); setDetailExercise(ex); }}
                                          title="Ver detalhes"
                                        >
                                          <HelpCircle className="h-3.5 w-3.5" />
                                        </button>
                                        <Badge variant="outline" className="text-[10px]">#{idx + 1}</Badge>
                                      </div>
                                    </div>

                                    {/* Prescrição resumida */}
                                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                                      {ex.sets && (
                                        <span className="flex items-center gap-1">
                                          <Layers className="h-3 w-3" />{ex.sets} séries
                                        </span>
                                      )}
                                      {ex.reps && (
                                        <span className="flex items-center gap-1">
                                          <Repeat className="h-3 w-3" />{ex.reps} reps
                                        </span>
                                      )}
                                      {ex.rest_seconds && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />{ex.rest_seconds}s
                                        </span>
                                      )}
                                      {ex.load && (
                                        <span className="flex items-center gap-1">
                                          💪 {ex.load}
                                        </span>
                                      )}
                                      {ex.tempo && (
                                        <span className="flex items-center gap-1">
                                          <Zap className="h-3 w-3" />{ex.tempo}
                                        </span>
                                      )}
                                    </div>

                                    {/* Observações inline */}
                                    {ex.obs && (
                                      <div className="mt-2 flex items-start gap-1.5">
                                        <StickyNote className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-muted-foreground leading-relaxed">{ex.obs}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Vídeo embed expandível */}
                              {videoOpen && ytId && (
                                <div className="px-4 pb-3">
                                  <div className="rounded-xl overflow-hidden aspect-video bg-black">
                                    <iframe
                                      src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&autoplay=1`}
                                      className="w-full h-full"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      title={ex.exercise_name}
                                    />
                                  </div>
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
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Nenhum exercício cadastrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </MobileContent>

      {/* Footer CTA */}
      {!loading && !error && !isExpired && blocks.length > 0 && (
        <MobileFooter>
          {!activeSession ? (
            <Button variant="premium" size="xl" className="w-full gap-2" onClick={handleStart} disabled={starting}>
              {starting
                ? <><Loader2 className="h-5 w-5 animate-spin" />Iniciando...</>
                : workout?.finished
                  ? <><RefreshCw className="h-5 w-5" />Novo Ciclo — Repetir Treino</>
                  : <><Play className="h-5 w-5" />Iniciar Treino</>
              }
            </Button>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              {/* Barra de progresso */}
              {totalExercises > 0 && (
                <div className="flex items-center gap-2 px-1">
                  <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium tabular-nums">
                    {completedCount}/{totalExercises}
                  </span>
                </div>
              )}
              <Button
                variant="premium"
                size="xl"
                className="w-full gap-2"
                onClick={() => setShowFinishModal(true)}
                disabled={completedCount === 0}
              >
                <CheckCircle2 className="h-5 w-5" />
                {completedCount === 0
                  ? "Marque exercícios para finalizar"
                  : completedCount === totalExercises
                    ? "Finalizar Treino ✓"
                    : `Finalizar Treino (${completedCount}/${totalExercises})`}
              </Button>
            </div>
          )}
        </MobileFooter>
      )}

      {/* Modal detalhes do exercício */}
      {detailExercise && (
        <ExerciseDetailModal
          exercise={detailExercise}
          onClose={() => setDetailExercise(null)}
        />
      )}

      {/* Modal PDF — usa PDF.js via CDN para evitar bloqueio de iframe */}
      {showPdfModal && workout?.pdf_url && (
        <PdfModal url={workout.pdf_url} onClose={() => setShowPdfModal(false)} />
      )}

      {/* Modal finalizar */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="bg-card border-border w-full max-w-sm">
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <div className={cn(
                  "h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3 border",
                  progressPct === 100
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-primary/10 border-primary/20"
                )}>
                  <Trophy className={cn("h-8 w-8", progressPct === 100 ? "text-green-400" : "text-primary")} />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground">
                  {progressPct === 100 ? "Treino Concluído! 🏆" : "Finalizar Treino?"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {progressPct === 100
                    ? "Parabéns! Você completou todos os exercícios."
                    : `Você completou ${completedCount} de ${totalExercises} exercícios (${progressPct}%).`}
                </p>
              </div>

              {/* Barra de progresso */}
              <div className="space-y-1.5">
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500",
                      progressPct === 100 ? "bg-green-400" : "bg-primary")}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {completedCount} de {totalExercises} exercícios
                </p>
              </div>

              {/* Aviso se incompleto */}
              {progressPct < 100 && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl px-3 py-2.5 text-xs text-orange-400 text-center">
                  ⚠️ {totalExercises - completedCount} exercício{totalExercises - completedCount > 1 ? "s" : ""} ainda não foram marcados.
                </div>
              )}

              <div className="space-y-2">
                <Button
                  variant="premium"
                  className={cn("w-full", progressPct === 100 && "bg-green-500 hover:bg-green-600 border-green-500")}
                  onClick={handleFinish}
                  disabled={finishing}
                >
                  {finishing
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Finalizando...</>
                    : progressPct === 100
                      ? <><CheckCircle2 className="h-4 w-4" />Concluir Treino</>
                      : <><CheckCircle2 className="h-4 w-4" />Finalizar Mesmo Assim</>
                  }
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground"
                  onClick={() => setShowFinishModal(false)}>
                  Continuar Treinando
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </MobileContainer>
  );
};

export default StudentWorkoutPage;