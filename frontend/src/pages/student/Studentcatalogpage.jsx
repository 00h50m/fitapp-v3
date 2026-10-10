import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getJourneys, getCategories, getStudentJourneys, getGrantedJourneyIds, enrollStudentInJourney, PERSONAL_WHATSAPP } from "@/services/journeyService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BottomNav } from "@/components/layout/BottomNav";
import { Loader2, BookOpen, ChevronRight, CheckCircle2, Lock, MessageCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABEL } from "@/lib/difficultyLabels";

function openWhatsApp(journeyTitle) {
  const msg = encodeURIComponent(`Olá! Tenho interesse em liberar acesso à jornada "${journeyTitle}". Poderia me ajudar?`);
  window.open(`https://wa.me/${PERSONAL_WHATSAPP}?text=${msg}`, "_blank");
}

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
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
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

// ── Card de lista plana ("Programas", fiel ao protótipo) ────────
// Cada jornada é seu próprio cartão flutuante (não uma linha de tabela),
// com selo de ícone em tom suave da cor da jornada — igual ao .feature
// do protótipo (ícone em quadrado 42px com fundo tingido a 16%).
const JourneyListRow = ({ journey, studentJourney, hasAccess, onSelect }) => {
  const isActive = studentJourney?.status === "active";
  const isDone = studentJourney?.status === "completed";
  const locked = !hasAccess;
  const total = journey.journey_workouts?.[0]?.count ?? 0;
  const completed = studentJourney?.completed_workouts ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasCover = !!journey.cover_image_url;
  const tint = journey.cover_color || "hsl(var(--primary))";
  const subtitle = journey.description || `${journey.category ? journey.category.name : "Geral"} · ${total} treino${total !== 1 ? "s" : ""}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(journey)}
      className="w-full flex items-center gap-3 bg-card rounded-[18px] p-3.5 text-left shadow-sm hover:shadow-md active:scale-[0.99] transition-all"
    >
      <div
        className="relative h-11 w-11 rounded-[13px] overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{
          background: hasCover ? undefined : `color-mix(in srgb, ${tint} 16%, transparent)`,
          filter: locked ? "grayscale(70%)" : "none",
        }}
      >
        {hasCover ? (
          <img src={journey.cover_image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg" style={{ filter: "saturate(1.3)" }}>{journey.cover_emoji}</span>
        )}
        {locked && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Lock className="h-3.5 w-3.5 text-white/90" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{journey.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
        {!locked && isActive && (
          <div className="h-1 bg-secondary rounded-full overflow-hidden mt-1.5 max-w-[140px]">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center gap-1.5">
        {locked ? (
          <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
        ) : isDone ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : isActive ? (
          <span className="text-[11px] font-semibold text-primary">{progress}%</span>
        ) : null}
        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
      </div>
    </button>
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
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "mine" | categoryId

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

  // Aplica o filtro indicado na URL (vindo do atalho "O que você quer treinar hoje?" da Home)
  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash;
    if (hash?.startsWith("#cat-")) setActiveFilter(hash.replace("#cat-", ""));
  }, [loading]);

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

  const myJourneys = journeys.filter(j => studentJourneys.some(sj => sj.journey_id === j.id));

  // Chips só para categorias que de fato têm jornada cadastrada
  const chipCategories = categories.filter(cat => journeys.some(j => j.category_id === cat.id));

  const filteredJourneys = journeys.filter(j => {
    if (activeFilter === "all") return true;
    if (activeFilter === "mine") return studentJourneys.some(sj => sj.journey_id === j.id);
    return j.category_id === activeFilter;
  });

  return (
    <div className="min-h-screen bg-background pb-24 w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/student")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1" />
        <div className="flex gap-3 text-xs text-muted-foreground">
          {myJourneys.length > 0 && <span className="text-primary">{myJourneys.length} ativa{myJourneys.length !== 1 ? "s" : ""}</span>}
          <span>{journeys.length} total</span>
        </div>
      </div>

      {/* Título grande, fiel ao protótipo */}
      <div className="px-4 pt-5 pb-1">
        <h2 className="text-2xl font-display font-bold text-foreground">Jornadas</h2>
        <p className="text-sm text-muted-foreground mt-1">Programas completos para cada objetivo e rotina.</p>
      </div>

      {/* Chips de filtro (lista plana filtrável, fiel ao protótipo) */}
      {!loading && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-2 pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={cn(
              "flex-shrink-0 text-xs font-medium px-3 py-2 rounded-full transition-colors",
              activeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            )}
          >
            Todas
          </button>
          {myJourneys.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter("mine")}
              className={cn(
                "flex-shrink-0 text-xs font-medium px-3 py-2 rounded-full transition-colors",
                activeFilter === "mine" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              )}
            >
              Minhas
            </button>
          )}
          {chipCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveFilter(cat.id)}
              className={cn(
                "flex-shrink-0 text-xs font-medium px-3 py-2 rounded-full transition-colors",
                activeFilter === cat.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              )}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : journeys.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground px-4">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">Nenhuma jornada disponível ainda.</p>
        </div>
      ) : filteredJourneys.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground px-4">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">Nenhuma jornada nesse filtro ainda.</p>
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-3">
          {filteredJourneys.map(j => (
            <JourneyListRow
              key={j.id}
              journey={j}
              studentJourney={studentJourneys.find(sj => sj.journey_id === j.id) ?? null}
              hasAccess={grantedIds.has(j.id)}
              onSelect={setSelectedJourney}
            />
          ))}

          <div className="bg-card/60 border border-dashed border-border rounded-2xl p-5 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Quer mais jornadas liberadas pra você?</p>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => openWhatsApp("novas jornadas disponíveis")}>
              <MessageCircle className="h-4 w-4" />Falar com o personal
            </Button>
          </div>
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
      <BottomNav />
    </div>
  );
};

export default StudentCatalogPage;
