import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { CreditCard, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getTierOwnFeatures, FEATURE_LABEL } from "@/lib/planPermissions";

// Vitrine visual dos planos. As features exibidas vêm da mesma matriz
// central (lib/planPermissions.js) que bloqueia de verdade no frontend e no
// backend — não há uma segunda lista de regras para manter sincronizada.
const PLANS = [
  {
    key: "essencial",
    tag: "Entrada",
    name: "Essencial",
    description: "Conteúdo guiado para quem quer começar sem acompanhamento.",
    highlight: false,
  },
  {
    key: "pro",
    tag: "Mais escolhido",
    name: "Pro",
    description: "Execução dentro do app com controle de conclusão.",
    highlight: true,
  },
  {
    key: "consultoria",
    tag: "Completo",
    name: "Consultoria",
    description: "Acompanhamento individual e decisões baseadas na evolução.",
    highlight: false,
  },
].map(plan => ({ ...plan, features: getTierOwnFeatures(plan.key).map(f => FEATURE_LABEL[f]) }));

const PlansPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Planos e acessos
            </h1>
            <p className="text-muted-foreground mt-1">Controle o que cada aluno consegue usar.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div key={plan.key} className={cn(
              "bg-card rounded-2xl p-5 border",
              plan.highlight ? "border-primary" : "border-border"
            )}>
              <span className={cn(
                "inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full mb-3",
                plan.highlight ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {plan.tag}
              </span>
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              <div className="space-y-2 mt-4">
                {plan.key !== "essencial" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Tudo do {plan.key === "pro" ? "Essencial" : "Pro"}</span>
                  </div>
                )}
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full mt-5"
                onClick={() => toast("Edição de recursos por plano ainda não está disponível — a matriz hoje é fixa no código.")}
              >
                Editar recursos
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Esses recursos já são bloqueados de verdade (frontend e backend) conforme o plano de cada aluno. Editar essa matriz pela tela ainda não está disponível — hoje ela vive em código (lib/planPermissions.js).
        </p>
      </div>
    </AdminLayout>
  );
};

export default PlansPage;
