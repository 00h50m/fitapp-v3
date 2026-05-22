import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getJourneys, getCategories, getStudentJourneys, getGrantedJourneyIds, enrollStudentInJourney, PERSONAL_WHATSAPP } from "@/services/journeyService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, BookOpen, ChevronRight, CheckCircle2, Clock, Zap, Lock, MessageCircle, ArrowLeft } from "lucide-react";
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

// ── Card estilo Netflix ────────────────────────────────────────
const JourneyCard = ({ journey, studentJourney, hasAccess, onSelect }) => {
  const total = journey.journey_workouts?.[0]?.count ?? 0;
  const completed = studentJourney?.completed_workouts ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isActive = studentJourney?.status === "active";
  const isDone = studentJourney?.status === "completed";
  const locked = !hasAccess;
  const hasCover = !!journey.cover_image_url;

  return (
    <div
      className="flex-shrink-0 w-36 sm:w-44 cursor-pointer group"
      onClick={() => onSelect(journey)}
    >
      {/* Capa */}
      <div className="relative h-52 sm:h-64 rounded-xl overflow-hidden mb-2">
        {/* Background */}
        <div
          className="absolute inset-0 flex items-center justify-center text-6xl transition-transform duration-300 group-hover:scale-105"
          style={{ background: hasCover ? "transparent" : journey.cover_color, filter: locked ? "grayscale(70%)" : "none" }}
        >
          {hasCover ? (
            <img src={journey.cover_image_url} alt={journey.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <span>{journey.cover_emoji}</span>
          )}
        </div>

        {/* Overlay escuro no hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

        {/* Cadeado */}
        {locked && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-black/70 rounded-full p-3">
              <Lock className="h-6 w-6 text-white/80" />
            </div>
          </div>
        )}

        {/* Badge status */}
        {!locked && isDone && (
          <div className="absolute top-2 left-2 bg-green-500/90 rounded-full px-2 py-0.5 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-white" />
            <span className="text-[10px] text-white font-medium">Concluída</span>
          </div>
        )}
        {!locked && isActive && (
          <div className="absolute top-2 left-2 bg-primary/90 rounded-full px-2 py-0.5 flex items-center gap-1">
            <Zap className="h-3 w-3 text-white" />
            <span className="text-[10px] text-white font-medium">Ativa</span>
          </div>
        )}

        {/* Barra de progresso na base */}
        {!locked && (isActive || isDone) && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${isDone ? 100 : progress}%` }} />
          </div>
        )}

        {/* Gradiente inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Dificuldade */}
        <div className="absolute bottom-2 right-2">
          <span className={cn("text-[10px] font-medium", DIFFICULTY_LABEL[journey.difficulty]?.color ?? "text-white/60")}>
            {DIFFICULTY_LABEL[journey.difficulty]?.label}
          </span>
        </div>
      </div>

      {/* Info */}
      <p className="text-sm font-medium text-foreground leading-tight truncate">{journey.title}</p>
      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
        {journey.duration_days && <span>{journey.duration_days}d</span>}
        <span>{total} treino{total !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
};

// ── Modal de detalhe ───────────────────────────────────────────
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
        {/* Capa grande */}
        <div
          className="h-48 flex items-center justify-center relative overflow-hidden"
          style={{ background: hasCover ? "transparent" : journey.cover_color, filter: locked ? "grayscale(60%)" : "none" }}
        >
          {hasCover ? (
            <img src={journey.cover_image_url} alt={journey.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <span className="text-7xl">{journey.cover_emoji}</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          {locked && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Lock className="h-10 w-10 text-white/80" /></div>}
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold">{journey.title}</h2>
            {journey.description && <p className="text-sm text-muted-foreground mt-1">{journey.description}</p>}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-secondary rounded-lg p-2"><p className="text-sm font-medium">{journey.duration_days ?? "—"}d</p><p className="text-xs text-muted-foreground">Duração</p></div>
            <div className="bg-secondary rounded-lg p-2"><p className="text-sm font-medium">{total}</p><p className="text-xs text-muted-foreground">Treinos</p></div>
            <div className="bg-secondary rounded-lg p-2">
              <p className={cn("text-sm font-medium", DIFFICULTY_LABEL[journey.difficulty]?.color)}>{DIFFICULTY_LABEL[journey.difficulty]?.label ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Nível</p>
            </div>
          </div>

          {/* Progresso se ativa */}
          {!locked && isActive && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Progresso</span><span>{progress}%</span></div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Dia {completed} de {total}</p>
            </div>
          )}

          {/* Bloqueada */}
          {locked && (
            <div className="bg-secondary/60 rounded-xl p-4 text-center space-y-3">
              <p className="text-sm font-medium">Jornada bloqueada</p>
              <p className="text-xs text-muted-foreground">Fale com seu personal para liberar o acesso.</p>
              <Button className="w-full bg-green-600 hover:bg-green-500 text-white" onClick={() => openWhatsApp(journey.title)}>
                <MessageCircle className="h-4 w-4 mr-2" />Falar com o personal
              </Button>
            </div>
          )}

          {/* Liberada */}
          {!locked && !isDone && (
            <Button className="w-full" onClick={onStart} disabled={starting}>
              {starting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Iniciando...</> : isActive ? "Continuar jornada" : "Iniciar jornada"}
            </Button>
          )}

          {/* Concluída */}
          {!locked && isDone && (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">Jornada concluída!</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => openWhatsApp(`próxima etapa após ${journey.title}`)}>
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

// ── Row horizontal por categoria ───────────────────────────────
const CategoryRow = ({ title, journeys, studentJourneys, grantedIds, onSelect }) => {
  if (!journeys.length) return null;
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-foreground mb-3 px-4">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-none">
        {journeys.map(j => (
          <JourneyCard
            key={j.id}
            journey={j}
            studentJourney={studentJourneys.find(sj => sj.journey_id === j.id) ?? null}
            hasAccess={grantedIds.has(j.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

// ── Página principal ───────────────────────────────────────────
const StudentCatalogPage = () => {
  const navigate = useNavigate();
  const [journeys, setJourneys] = useState([]);
  const [categories, setCategories] = useState([]);
  const [studentJourneys, setStudentJourneys] = useState([]);
  const [grantedIds, setGrantedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [starting, setStarting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      const [j, c, sj, ids] = await Promise.all([
        getJourneys(),
        getCategories(),
        getStudentJourneys(profile.id),
        getGrantedJourneyIds(profile.id),
      ]);
      setJourneys(j); setCategories(c); setStudentJourneys(sj); setGrantedIds(new Set(ids));
    } catch { toast.error("Erro ao carregar catálogo"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleEnroll = async (journey) => {
    setStarting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      await enrollStudentInJourney(profile.id, journey.id);
      toast.success(`Jornada "${journey.title}" iniciada! 🚀`);
      await loadAll(); setSelectedJourney(null);
    } catch { toast.error("Erro ao iniciar jornada"); }
    finally { setStarting(false); }
  };

  const selectedStudentJourney = selectedJourney ? studentJourneys.find(sj => sj.journey_id === selectedJourney.id) ?? null : null;
  const selectedHasAccess = selectedJourney ? grantedIds.has(selectedJourney.id) : false;

  // Organiza por categoria
  const myJourneys = journeys.filter(j => studentJourneys.some(sj => sj.journey_id === j.id));
  const availableJourneys = journeys.filter(j => grantedIds.has(j.id) && !studentJourneys.some(sj => sj.journey_id === j.id));
  const lockedJourneys = journeys.filter(j => !grantedIds.has(j.id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/student")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold">Jornadas</h1>
        <div className="flex-1" />
        <div className="flex gap-3 text-xs text-muted-foreground">
          {myJourneys.length > 0 && <span className="text-primary">{myJourneys.length} ativa{myJourneys.length !== 1 ? "s" : ""}</span>}
          <span>{journeys.length} total</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : journeys.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground px-4">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">Nenhuma jornada disponível ainda.</p>
        </div>
      ) : (
        <div className="pt-4">
          {/* Minhas jornadas */}
          {myJourneys.length > 0 && (
            <CategoryRow title="Minhas jornadas" journeys={myJourneys} studentJourneys={studentJourneys} grantedIds={grantedIds} onSelect={setSelectedJourney} />
          )}

          {/* Disponíveis por categoria */}
          {categories.map(cat => {
            const catJourneys = availableJourneys.filter(j => j.category_id === cat.id);
            return (
              <CategoryRow key={cat.id} title={`${cat.emoji} ${cat.name}`} journeys={catJourneys} studentJourneys={studentJourneys} grantedIds={grantedIds} onSelect={setSelectedJourney} />
            );
          })}

          {/* Sem categoria */}
          {availableJourneys.filter(j => !j.category_id).length > 0 && (
            <CategoryRow title="Disponíveis" journeys={availableJourneys.filter(j => !j.category_id)} studentJourneys={studentJourneys} grantedIds={grantedIds} onSelect={setSelectedJourney} />
          )}

          {/* Bloqueadas */}
          {lockedJourneys.length > 0 && (
            <CategoryRow title="🔒 Em breve" journeys={lockedJourneys} studentJourneys={studentJourneys} grantedIds={grantedIds} onSelect={setSelectedJourney} />
          )}
        </div>
      )}

      {selectedJourney && (
        <JourneyDetailModal
          journey={selectedJourney}
          studentJourney={selectedStudentJourney}
          hasAccess={selectedHasAccess}
          onClose={() => setSelectedJourney(null)}
          onStart={() => {
            if (selectedStudentJourney?.status === "active") navigate(`/student/journey/${selectedJourney.id}`);
            else handleEnroll(selectedJourney);
          }}
          starting={starting}
        />
      )}
    </div>
  );
};

export default StudentCatalogPage;
