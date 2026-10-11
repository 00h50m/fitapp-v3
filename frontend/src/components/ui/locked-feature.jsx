import React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// Banner inline usado quando uma função não está disponível no plano atual do aluno.
// A regra de negócio (quem pode ver isso) nunca deve morar aqui — só a apresentação.
export function LockedFeature({ label, requiredTierLabel, className, compact = false }) {
  if (compact) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground/70", className)}>
        <Lock className="h-3.5 w-3.5" />
        {label}
        {requiredTierLabel && <span className="text-[10px]">· {requiredTierLabel}</span>}
      </span>
    );
  }
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3", className)}>
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Lock className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {requiredTierLabel && (
          <p className="text-xs text-muted-foreground mt-0.5">Disponível no plano {requiredTierLabel} ou superior.</p>
        )}
      </div>
    </div>
  );
}

export default LockedFeature;
