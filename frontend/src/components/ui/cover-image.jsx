import React from "react";
import { cn } from "@/lib/utils";

// Capa com foto opcional (vinda do Supabase Storage) + fallback gradiente/
// emoji quando não houver foto ainda. Usado em jornadas, treinos padrão e
// cards do catálogo — mesmo padrão em todo lugar.
export const CoverImage = ({ src, color, emoji, alt = "", className, children }) => (
  <div
    className={cn("relative overflow-hidden", className)}
    style={{ background: src ? undefined : (color || "hsl(var(--primary) / 0.18)") }}
  >
    {src ? (
      <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
    ) : emoji ? (
      <div className="absolute inset-0 flex items-center justify-center text-5xl">{emoji}</div>
    ) : null}
    {children}
  </div>
);
