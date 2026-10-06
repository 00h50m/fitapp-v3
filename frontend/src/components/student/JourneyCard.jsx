import React from "react";
import { CheckCircle2, Zap, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABEL } from "@/lib/difficultyLabels";

const SIZE_CLASSES = {
  sm: { card: "w-32", cover: "h-48" },
  md: { card: "w-36 sm:w-44", cover: "h-52 sm:h-64" },
};

// ── Card editorial (capa com título e selo de progresso sobrepostos) ──
export const JourneyCard = ({ journey, studentJourney, hasAccess, onSelect, size = "sm" }) => {
  const total = journey.journey_workouts?.[0]?.count ?? 0;
  const completed = studentJourney?.completed_workouts ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isActive = studentJourney?.status === "active";
  const isDone = studentJourney?.status === "completed";
  const locked = !hasAccess;
  const hasCover = !!journey.cover_image_url;
  const { card, cover } = SIZE_CLASSES[size] ?? SIZE_CLASSES.sm;

  return (
    <div className={cn("flex-shrink-0 cursor-pointer group", card)} onClick={() => onSelect(journey)}>
      <div className={cn("relative rounded-2xl overflow-hidden", cover)}>
        <div
          className="absolute inset-0 flex items-center justify-center text-5xl transition-transform duration-300 group-hover:scale-105"
          style={{ background: hasCover ? "transparent" : journey.cover_color, filter: locked ? "grayscale(70%)" : "none" }}
        >
          {hasCover ? (
            <img src={journey.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <span>{journey.cover_emoji}</span>
          )}
        </div>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

        {locked && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-black/70 rounded-full p-3">
              <Lock className="h-6 w-6 text-white/80" />
            </div>
          </div>
        )}

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

        {!locked && (isActive || isDone) && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 z-10">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${isDone ? 100 : progress}%` }} />
          </div>
        )}

        {/* Título e metadados sobrepostos na capa, estilo editorial */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 pt-6">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={cn("text-[9px] font-medium uppercase tracking-wide", DIFFICULTY_LABEL[journey.difficulty]?.overlayColor ?? "text-white/60")}>
              {DIFFICULTY_LABEL[journey.difficulty]?.label}
            </span>
            <span className="text-[9px] text-white/70">
              {journey.duration_days ? `${journey.duration_days}d · ` : ""}{total} treino{total !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-white leading-tight line-clamp-2">{journey.title}</p>
        </div>
      </div>
    </div>
  );
};
