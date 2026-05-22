import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, Loader2, Play, Bookmark, BookmarkCheck,
  Layers, Repeat, Clock, Weight, Zap, FileText, X,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const blockTypeConfig = {
  normal:   { label: "Normal",    color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  single:   { label: "Simples",   color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  biset:    { label: "Biset",     color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  triset:   { label: "Triset",    color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  circuit:  { label: "Circuito",  color: "bg-green-500/15 text-green-400 border-green-500/30" },
  dropset:  { label: "Drop Set",  color: "bg-red-500/15 text-red-400 border-red-500/30" },
  giantset: { label: "Giant Set", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
};

const WorkoutPreviewPage = () => {
  const { id: templateId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [template, setTemplate]       = useState(null);
  const [blocks, setBlocks]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saved, setSaved]             = useState(false);
  const [saving, setSaving]           = useState(false);
  const [showPdf, setShowPdf]         = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState(new Set());

  const load = useCallback(async () => {
    if (!user || !templateId) return;
    setLoading(true);
    try {
      const { data: tmpl, error: tmplErr } = await supabase
        .from("workout_templates").select("*").eq("id", templateId).single();
      if (tmplErr) throw tmplErr;
      setTemplate(tmpl);

      const { data: blockData } = await supabase
        .from("workout_template_blocks").select("*").eq("template_id", templateId).order("order_index");

      const { data: exData } = await supabase
        .from("workout_template_exercises")
        .select("*, exercise:exercises(id, name, video_url, muscle_group, equipment)")
        .eq("template_id", templateId).order("order_index");

      const blockMap = {};
      for (const b of blockData || []) blockMap[b.id] = { ...b, exercises: [] };
      for (const ex of exData || []) { if (blockMap[ex.block_id]) blockMap[ex.block_id].exercises.push(ex); }
      const sorted = Object.values(blockMap).sort((a, b) => a.order_index - b.order_index);
      setBlocks(sorted);
      // Expande todos os blocos por padrão
      setExpandedBlocks(new Set(sorted.map(b => b.id)));

      const { data: savedData } = await supabase
        .from("saved_workouts").select("id").eq("student_id", user.id).eq("workout_template_id", templateId).maybeSingle();
      setSaved(!!savedData);
    } catch (err) {
      toast.error("Erro ao carregar treino: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [user, templateId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (saved) {
        await supabase.from("saved_workouts").delete().eq("student_id", user.id).eq("workout_template_id", templateId);
        setSaved(false);
        toast.success("Removido dos salvos");
      } else {
        await supabase.from("saved_workouts").insert({ student_id: user.id, workout_template_id: templateId });
        setSaved(true);
        toast.success("Treino salvo! 🔖");
      }
    } catch (err) { toast.error("Erro: " + err.message); }
    finally { setSaving(false); }
  };

  const handleStartWorkout = async () => {
    try {
      const { data: sw } = await supabase
        .from("student_workouts").select("id")
        .eq("student_id", user.id).eq("template_id", templateId).eq("status", "active")
        .maybeSingle();
      if (sw?.id) {
        navigate(`/student/workout/${sw.id}`);
      } else {
        toast("Este treino não está atribuído a você. Fale com seu personal.");
      }
    } catch { toast.error("Erro ao abrir treino"); }
  };

  const toggleBlock = (id) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!template) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-muted-foreground text-sm">Treino não encontrado</p>
      <Button variant="outline" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4 mr-1" />Voltar</Button>
    </div>
  );

  const totalExercises = blocks.reduce((s, b) => s + b.exercises.length, 0);

  return (
    <div className="min-h-screen bg-background pb-28 max-w-md mx-auto">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">{template.title}</h1>
          <p className="text-xs text-muted-foreground">{blocks.length} blocos · {totalExercises} exercícios</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {template.pdf_url && (
            <button onClick={() => setShowPdf(true)} className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
              <FileText className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-all", saved ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-primary")}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
        {template.description && (
          <p className="text-sm text-muted-foreground">{template.description}</p>
        )}

        {saved && (
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <BookmarkCheck className="h-3.5 w-3.5" />
            <span>Salvo na sua biblioteca</span>
          </div>
        )}

        {/* Blocos */}
        {blocks.map((block, bIdx) => {
          const typeCfg = blockTypeConfig[block.block_type] || blockTypeConfig.normal;
          const isExpanded = expandedBlocks.has(block.id);

          return (
            <div key={block.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Header bloco */}
              <button
                className="w-full px-4 py-3 flex items-center gap-3 text-left"
                onClick={() => toggleBlock(block.id)}
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{block.block_label || `Bloco ${String.fromCharCode(65+bIdx)}`}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border", typeCfg.color)}>{typeCfg.label}</span>
                    <span className="text-[10px] text-muted-foreground">{block.exercises.length} exerc.</span>
                    {block.rest_after_block_seconds && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />{block.rest_after_block_seconds}s
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              </button>

              {/* Exercícios */}
              {isExpanded && (
                <div className="divide-y divide-border/50 border-t border-border">
                  {block.exercises.map((ex, exIdx) => (
                    <div key={ex.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{ex.exercise?.name ?? "Exercício"}</p>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                            {ex.sets && <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{ex.sets} séries</span>}
                            {ex.reps && <span className="flex items-center gap-1"><Repeat className="h-3 w-3" />{ex.reps} reps</span>}
                            {ex.rest_seconds && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ex.rest_seconds}s</span>}
                            {ex.load && <span className="flex items-center gap-1"><Weight className="h-3 w-3" />{ex.load}</span>}
                            {ex.tempo && <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{ex.tempo}</span>}
                          </div>
                          {ex.notes && <p className="text-xs text-muted-foreground mt-1 italic">{ex.notes}</p>}
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">#{exIdx+1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            className={cn("gap-2 flex-shrink-0", saved ? "border-primary/30 text-primary" : "")}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {saved ? "Salvo" : "Salvar"}
          </Button>
          <Button className="flex-1 gap-2" onClick={handleStartWorkout}>
            <Play className="h-4 w-4" />Treinar agora
          </Button>
        </div>
      </div>

      {showPdf && template.pdf_url && <PdfModal url={template.pdf_url} onClose={() => setShowPdf(false)} />}
    </div>
  );
};

export default WorkoutPreviewPage;
