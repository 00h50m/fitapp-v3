import React from "react";
import { Lock, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/contexts/AppSettingsContext";

// Banner inline usado quando uma função não está disponível no plano atual do aluno.
// A regra de negócio (quem pode ver isso) nunca deve morar aqui — só a apresentação.
// Sempre oferece um caminho pro WhatsApp do personal, pra bloqueio nunca ser beco sem saída.
export function LockedFeature({ label, requiredTierLabel, className, compact = false }) {
  const { settings } = useAppSettings();
  const waHref = settings.whatsapp
    ? `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Olá! Quero saber como desbloquear: ${label}.`)}`
    : null;

  if (compact) {
    return (
      <a
        href={waHref || undefined}
        target={waHref ? "_blank" : undefined}
        rel={waHref ? "noopener noreferrer" : undefined}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground/70",
          waHref && "hover:bg-muted/70 cursor-pointer",
          className
        )}
      >
        <Lock className="h-3.5 w-3.5" />
        {label}
        {requiredTierLabel && <span className="text-[10px]">· {requiredTierLabel}</span>}
      </a>
    );
  }
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3", className)}>
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Lock className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {requiredTierLabel && (
          <p className="text-xs text-muted-foreground mt-0.5">Disponível no plano {requiredTierLabel} ou superior.</p>
        )}
      </div>
      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium px-3 py-2"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Falar com personal
        </a>
      )}
    </div>
  );
}

export default LockedFeature;
