import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getJourneys, getCategories, getStudentJourneys, getGrantedJourneyIds } from "@/services/journeyService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/layout/BottomNav";
import { JourneyCard } from "@/components/student/JourneyCard";
import { Loader2, BookOpen, ChevronRight, CheckCircle2, Lock, MessageCircle, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CoverGlyph } from "@/lib/coverIcons";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { CatalogSkeleton } from "@/components/student/LoadingSkeletons";

function openWhatsApp(whatsapp, journeyTitle) {
  const msg = encodeURIComponent(`Olá! Tenho interesse em liberar acesso à jornada "${journeyTitle}". Poderia me ajudar?`);
  window.open(`https://wa.me/${whatsapp}?text=${msg}`, "_blank");
}

// ── Linha de card (usada só na busca por texto — lista plana) ──────
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
          <img src={journey.cover_image_url} alt="" className="h-full w-full object-cover" style={{ objectPosition: `center ${journey.cover_focal_y ?? 50}%` }} />
        ) : (
          <div style={{ color: tint }}><CoverGlyph value={journey.cover_emoji} className="h-5 w-5" /></div>
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

// ── Fileira editorial (rolagem horizontal, estilo plataforma de conteúdo) ──
const JourneyRow = ({ title, journeys, getStudentJourney, grantedIds, onSelect }) => {
  if (!journeys.length) return null;
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-foreground mb-2.5">{title}</p>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {journeys.map(j => (
          <JourneyCard key={j.id} journey={j} studentJourney={getStudentJourney(j.id)} hasAccess={grantedIds.has(j.id)} onSelect={onSelect} size="md" />
        ))}
      </div>
    </div>
  );
};

// ── Página principal ───────────────────────────────────────────
const StudentCatalogPage = () => {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const [journeys, setJourneys] = useState([]);
  const [categories, setCategories] = useState([]);
  const [studentJourneys, setStudentJourneys] = useState([]);
  const [grantedIds, setGrantedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
  const [jumpToCategory, setJumpToCategory] = useState(null);
  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash;
    if (hash?.startsWith("#cat-")) setJumpToCategory(hash.replace("#cat-", ""));
  }, [loading]);
  useEffect(() => {
    if (!jumpToCategory) return;
    const el = document.getElementById(`cat-${jumpToCategory}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [jumpToCategory, journeys]);

  const getStudentJourney = (id) => studentJourneys.find(sj => sj.journey_id === id) ?? null;
  const myJourneys = journeys.filter(j => studentJourneys.some(sj => sj.journey_id === j.id));
  const availableJourneys = journeys.filter(j => grantedIds.has(j.id) && !studentJourneys.some(sj => sj.journey_id === j.id));
  const lockedJourneys = journeys.filter(j => !grantedIds.has(j.id));
  const newJourneys = journeys.slice(0, 8); // getJourneys() já ordena por created_at desc
  const noEquipmentJourneys = journeys.filter(j => j.equipment === "sem_equipamento" && grantedIds.has(j.id));
  const beginnerJourneys = journeys.filter(j => j.difficulty === "iniciante" && grantedIds.has(j.id));

  const handleSelect = (journey) => {
    const hasAccess = grantedIds.has(journey.id);
    if (!hasAccess) { openWhatsApp(settings.whatsapp, journey.title); return; }
    navigate(`/student/journey/${journey.id}`);
  };

  const searchResults = search.trim()
    ? journeys.filter(j => j.title.toLowerCase().includes(search.trim().toLowerCase()))
    : null;

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

      <div className="px-4 pt-5 pb-1">
        <h2 className="text-2xl font-display font-bold text-foreground">Programas</h2>
        <p className="text-sm text-muted-foreground mt-1">Encontre o programa certo pro seu objetivo e sua rotina.</p>
      </div>

      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar programa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
      </div>

      {loading ? (
        <CatalogSkeleton />
      ) : journeys.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground px-4">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">Nenhum programa disponível ainda.</p>
        </div>
      ) : searchResults !== null ? (
        // Busca ativa: lista plana filtrada
        <div className="px-4 pt-2 space-y-3">
          {searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Nenhum programa encontrado pra "{search}".</p>
          ) : searchResults.map(j => (
            <JourneyListRow key={j.id} journey={j} studentJourney={getStudentJourney(j.id)} hasAccess={grantedIds.has(j.id)} onSelect={handleSelect} />
          ))}
        </div>
      ) : (
        // Navegação editorial, por organização, estilo plataforma de conteúdo
        <div className="px-4 pt-3">
          <JourneyRow title="Em andamento" journeys={myJourneys} getStudentJourney={getStudentJourney} grantedIds={grantedIds} onSelect={handleSelect} />
          <JourneyRow title="Novos programas" journeys={newJourneys} getStudentJourney={getStudentJourney} grantedIds={grantedIds} onSelect={handleSelect} />
          <JourneyRow title="Comece por aqui" journeys={beginnerJourneys} getStudentJourney={getStudentJourney} grantedIds={grantedIds} onSelect={handleSelect} />
          <JourneyRow title="Sem equipamentos" journeys={noEquipmentJourneys} getStudentJourney={getStudentJourney} grantedIds={grantedIds} onSelect={handleSelect} />

          {categories.map(cat => {
            const catJourneys = availableJourneys.filter(j => j.category_id === cat.id);
            if (!catJourneys.length) return null;
            return (
              <div id={`cat-${cat.id}`} key={cat.id}>
                <JourneyRow
                  title={cat.name}
                  journeys={catJourneys}
                  getStudentJourney={getStudentJourney}
                  grantedIds={grantedIds}
                  onSelect={handleSelect}
                />
              </div>
            );
          })}

          {availableJourneys.filter(j => !j.category_id).length > 0 && (
            <JourneyRow title="Disponíveis" journeys={availableJourneys.filter(j => !j.category_id)} getStudentJourney={getStudentJourney} grantedIds={grantedIds} onSelect={handleSelect} />
          )}

          {lockedJourneys.length > 0 && (
            <JourneyRow title="🔒 Em breve" journeys={lockedJourneys} getStudentJourney={() => null} grantedIds={new Set()} onSelect={handleSelect} />
          )}

          <div className="bg-card/60 border border-dashed border-border rounded-2xl p-5 text-center space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">Quer mais programas liberados pra você?</p>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => openWhatsApp(settings.whatsapp, "novos programas disponíveis")}>
              <MessageCircle className="h-4 w-4" />Falar com o personal
            </Button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default StudentCatalogPage;
