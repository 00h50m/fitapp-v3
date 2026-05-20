import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getJourneys, getCategories, getStudentJourneys, getGrantedJourneyIds, enrollStudentInJourney, PERSONAL_WHATSAPP } from "@/services/journeyService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, BookOpen, ChevronRight, CheckCircle2, Clock, Zap, Lock, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DIFFICULTY_LABEL = {
  iniciante: { label: "Iniciante", color: "text-green-400" },
  intermediario: { label: "Intermediário", color: "text-yellow-400" },
  avancado: { label: "Avançado", color: "text-red-400" },
};

function openWhatsApp(journeyTitle) {
  const msg = encodeURIComponent(`Olá! Tenho interesse em liberar acesso à jornada "${journeyTitle}". Poderia me ajudar?`);
  window.open(`https://wa.me/${PERSONAL_WHATSAPP}?text=${msg}`, "_blank");
}

const JourneyCard = ({ journey, studentJourney, hasAccess, onSelect }) => {
  const diff = DIFFICULTY_LABEL[journey.difficulty] ?? DIFFICULTY_LABEL.intermediario;
  const total = journey.journey_workouts?.[0]?.count ?? 0;
  const completed = studentJourney?.completed_workouts ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isActive = studentJourney?.status === "active";
  const isDone = studentJourney?.status === "completed";
  const locked = !hasAccess;

  return (
    <div className={cn("bg-card border rounded-xl overflow-hidden transition-all cursor-pointer group", locked ? "border-border opacity-75 hover:opacity-90" : isActive ? "border-primary/40" : "border-border hover:border-border/60")} onClick={() => onSelect(journey)}>
      <div className="h-36 flex items-center justify-center text-6xl relative" style={{ background: journey.cover_color, filter: locked ? "grayscale(60%)" : "none" }}>
        <span className={cn("transition-transform duration-300", !locked && "group-hover:scale-110")}>{journey.cover_emoji}</span>
        {locked && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="bg-black/70 rounded-full p-3"><Lock className="h-6 w-6 text-white/80" /></div></div>}
        {!locked && isDone && <div className="absolute top-2 right-2 bg-black/60 rounded-full px-2 py-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-400" /><span className="text-xs text-green-400">Concluída</span></div>}
        {!locked && isActive && <div className="absolute top-2 right-2 bg-black/60 rounded-full px-2 py-1 flex items-center gap-1"><Zap className="h-3 w-3 text-primary" /><span className="text-xs text-primary">Em andamento</span></div>}
        {!locked && (isActive || isDone) && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30"><div className="h-full bg-primary transition-all duration-500" style={{ width: `${isDone ? 100 : progress}%` }} /></div>}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-sm leading-tight mb-1">{journey.title}</h3>
        {journey.category && <p className="text-xs text-muted-foreground mb-2">{journey.category.emoji} {journey.category.name}</p>}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className={diff.color}>{diff.label}</span>
          {journey.duration_days && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {journey.duration_days}d</span>}
          <span>{total} treino{total !== 1 ? "s" : ""}</span>
        </div>
        {!locked && isActive && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Dia {completed} de {total}</span><span>{progress}%</span></div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          {locked ? <span className="flex items-center gap-1 text-muted-foreground"><Lock className="h-3 w-3" /> Acesso bloqueado</span>
          : isDone ? <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="h-3 w-3" /> Concluída</span>
          : isActive ? <span className="flex items-center gap-1 text-primary font-medium">Continuar <ChevronRight className="h-3 w-3" /></span>
          : <span className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">Iniciar <ChevronRight className="h-3 w-3" /></span>}
        </div>
      </div>
    </div>
  );
};

const JourneyDetailModal = ({ journey, studentJourney, hasAccess, onClose, onStart, starting }) => {
  const total = journey.journey_workouts?.[0]?.count ?? 0;
  const isActive = studentJourney?.status === "active";
  const isDone = studentJourney?.status === "completed";
  const locked = !hasAccess;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <div className="h-20 rounded-xl flex items-center justify-center text-5xl mb-3 relative overflow-hidden" style={{ background: journey.cover_color, filter: locked ? "grayscale(60%)" : "none" }}>
            {journey.cover_emoji}
            {locked && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Lock className="h-8 w-8 text-white/80" /></div>}
          </div>
          <DialogTitle className="text-lg">{journey.title}</DialogTitle>
          {journey.description && <DialogDescription>{journey.description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-secondary rounded-lg p-2"><p className="text-sm font-medium">{journey.duration_days ?? "—"}d</p><p className="text-xs text-muted-foreground">Duração</p></div>
            <div className="bg-secondary rounded-lg p-2"><p className="text-sm font-medium">{total}</p><p className="text-xs text-muted-foreground">Treinos</p></div>
            <div className="bg-secondary rounded-lg p-2"><p className={cn("text-sm font-medium", DIFFICULTY_LABEL[journey.difficulty]?.color)}>{DIFFICULTY_LABEL[journey.difficulty]?.label ?? "—"}</p><p className="text-xs text-muted-foreground">Nível</p></div>
          </div>
          {locked && (
            <div className="bg-secondary/60 rounded-xl p-4 text-center space-y-3">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
              <div><p className="text-sm font-medium">Jornada bloqueada</p><p className="text-xs text-muted-foreground mt-1">Fale com o seu personal para liberar o acesso a essa jornada.</p></div>
              <Button className="w-full bg-green-600 hover:bg-green-500 text-white" onClick={() => openWhatsApp(journey.title)}><MessageCircle className="h-4 w-4 mr-2" />Falar com o personal</Button>
            </div>
          )}
          {!locked && !isDone && (
            <>
              {!isActive && <p className="text-xs text-muted-foreground">Ao iniciar, essa jornada ficará ativa no seu dashboard.</p>}
              <Button className="w-full" onClick={onStart} disabled={starting}>
                {starting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Iniciando...</> : isActive ? "Continuar jornada" : "Iniciar jornada"}
              </Button>
            </>
          )}
          {!locked && isDone && (
            <div className="text-center py-2">
              <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Jornada concluída!</p>
              <p className="text-xs text-muted-foreground mt-1">Parabéns! Fale com seu personal para o próximo passo.</p>
              <Button variant="outline" className="mt-3 w-full" onClick={() => openWhatsApp(`próxima etapa após ${journey.title}`)}><MessageCircle className="h-4 w-4 mr-2" />Falar com o personal</Button>
            </div>
          )}
          <Button variant="ghost" className="w-full" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StudentCatalogPage = () => {
  const navigate = useNavigate();
  const [journeys, setJourneys] = useState([]);
  const [categories, setCategories] = useState([]);
  const [studentJourneys, setStudentJourneys] = useState([]);
  const [grantedIds, setGrantedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [starting, setStarting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      const [j, c, sj, ids] = await Promise.all([getJourneys(), getCategories(), getStudentJourneys(profile.id), getGrantedJourneyIds(profile.id)]);
      setJourneys(j); setCategories(c); setStudentJourneys(sj); setGrantedIds(new Set(ids));
    } catch (err) { toast.error("Erro ao carregar catálogo"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const getStudentJourney = (journeyId) => studentJourneys.find(sj => sj.journey_id === journeyId) ?? null;

  const handleEnroll = async (journey) => {
    setStarting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      await enrollStudentInJourney(profile.id, journey.id);
      toast.success(`Jornada "${journey.title}" iniciada! 🚀`);
      await loadAll(); setSelectedJourney(null);
    } catch (err) { toast.error("Erro ao iniciar jornada"); }
    finally { setStarting(false); }
  };

  let filtered = journeys;
  if (filterCategory !== "all") filtered = filtered.filter(j => j.category_id === filterCategory);
  if (filterStatus === "mine") { const myIds = studentJourneys.map(sj => sj.journey_id); filtered = filtered.filter(j => myIds.includes(j.id)); }
  else if (filterStatus === "available") filtered = filtered.filter(j => grantedIds.has(j.id));
  else if (filterStatus === "locked") filtered = filtered.filter(j => !grantedIds.has(j.id));

  const activeCount = studentJourneys.filter(sj => sj.status === "active").length;
  const doneCount = studentJourneys.filter(sj => sj.status === "completed").length;
  const selectedStudentJourney = selectedJourney ? getStudentJourney(selectedJourney.id) : null;
  const selectedHasAccess = selectedJourney ? grantedIds.has(selectedJourney.id) : false;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-2xl mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-medium mb-1">Jornadas</h1>
          <div className="flex gap-3 text-xs text-muted-foreground">
            {activeCount > 0 && <span className="text-primary">{activeCount} ativa{activeCount !== 1 ? "s" : ""}</span>}
            {doneCount > 0 && <span className="text-green-400">{doneCount} concluída{doneCount !== 1 ? "s" : ""}</span>}
            <span>{journeys.length} no catálogo</span>
          </div>
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[{ key: "all", label: "Todas" }, { key: "available", label: "Liberadas" }, { key: "mine", label: "Minhas" }, { key: "locked", label: "🔒 Bloqueadas" }].map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)} className={cn("px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all", filterStatus === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>{f.label}</button>
          ))}
        </div>
        {categories.length > 0 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            <button onClick={() => setFilterCategory("all")} className={cn("px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all", filterCategory === "all" ? "bg-secondary text-foreground ring-1 ring-border" : "text-muted-foreground hover:text-foreground")}>Todas as categorias</button>
            {categories.map(c => <button key={c.id} onClick={() => setFilterCategory(filterCategory === c.id ? "all" : c.id)} className={cn("px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all", filterCategory === c.id ? "bg-secondary text-foreground ring-1 ring-border" : "text-muted-foreground hover:text-foreground")}>{c.emoji} {c.name}</button>)}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground"><BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Nenhuma jornada encontrada.</p></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(j => <JourneyCard key={j.id} journey={j} studentJourney={getStudentJourney(j.id)} hasAccess={grantedIds.has(j.id)} onSelect={setSelectedJourney} />)}
          </div>
        )}
      </div>
      {selectedJourney && <JourneyDetailModal journey={selectedJourney} studentJourney={selectedStudentJourney} hasAccess={selectedHasAccess} onClose={() => setSelectedJourney(null)} onStart={() => { if (selectedStudentJourney?.status === "active") { navigate("/student"); } else { handleEnroll(selectedJourney); } }} starting={starting} />}
    </div>
  );
};

export default StudentCatalogPage;
