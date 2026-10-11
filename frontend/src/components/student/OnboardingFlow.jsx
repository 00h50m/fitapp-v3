import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  X, ChevronLeft, ChevronRight, Sparkles, Compass, Play, CheckCircle2,
  Trophy, Check, PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { usePlanPermission, FEATURES, TIER_FEATURES, FEATURE_LABEL } from "@/lib/planPermissions";

// Fluxo de primeiro acesso — no máximo 5 etapas, objetivo, sem ser
// apresentação comercial. "Pular" só fecha a sessão atual (não persiste,
// volta a aparecer depois); concluir ou "não mostrar novamente" grava
// profiles.onboarding_completed_at via RPC (nunca um UPDATE direto, pra não
// abrir edição geral do perfil pro aluno).
export const OnboardingFlow = ({ profile, onClose }) => {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const perm = usePlanPermission(profile);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const firstName = (profile?.name || "Aluno").split(" ")[0];

  const persistAndClose = async () => {
    setSaving(true);
    try { await supabase.rpc("mark_onboarding_seen"); } catch { /* não bloqueia o fechamento por isso */ }
    setSaving(false);
    onClose();
  };

  const steps = [
    {
      // 1. Boas-vindas do personal
      icon: Sparkles,
      content: (
        <div className="text-center space-y-4">
          {settings.avatar_url ? (
            <img src={settings.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover mx-auto border-2 border-primary/20" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">Bem-vindo(a), {firstName}!</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              {settings.professional_bio || `Aqui é o ${settings.professional_name || settings.display_name}. Vamos te mostrar rapidinho como o app funciona.`}
            </p>
          </div>
        </div>
      ),
    },
    {
      // 2. Como o app funciona
      icon: Compass,
      content: (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-center">Como o app funciona</h2>
          <div className="space-y-3">
            {[
              { icon: Compass, text: "Escolha um programa ou use o treino que seu personal montou pra você" },
              { icon: Play, text: "Abra o treino do dia e siga os exercícios, com vídeo e instruções" },
              { icon: Trophy, text: "Acompanhe sua evolução na aba Evolução" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><s.icon className="h-4 w-4 text-primary" /></div>
                <p className="text-sm">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      // 3. Apresentação do plano contratado
      icon: Check,
      content: (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-center">Seu plano: {perm.tierLabel}</h2>
          <p className="text-sm text-muted-foreground text-center">Veja o que você já pode usar:</p>
          <div className="space-y-2">
            {(TIER_FEATURES[perm.tier] || []).map(f => (
              <div key={f} className="flex items-center gap-2.5 bg-primary/5 border border-primary/15 rounded-xl px-3 py-2.5">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm">{FEATURE_LABEL[f]}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      // 4. Demonstração iniciar/concluir treino
      icon: Play,
      content: (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-center">
            {perm.can(FEATURES.FINISH_WORKOUT) ? "Iniciar e concluir um treino" : "Acompanhando seu treino"}
          </h2>
          {perm.can(FEATURES.FINISH_WORKOUT) ? (
            <div className="flex items-center justify-between gap-2">
              {[
                { icon: Play, label: "Iniciar" },
                { icon: CheckCircle2, label: "Marcar exercício" },
                { icon: Trophy, label: "Finalizar" },
              ].map((s, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="h-11 w-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"><s.icon className="h-5 w-5 text-primary" /></div>
                    <span className="text-[11px] text-center text-muted-foreground">{s.label}</span>
                  </div>
                  {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center max-w-sm mx-auto">
              No seu plano você acompanha o PDF, os vídeos e as instruções de cada treino. Marcar exercícios e acompanhar frequência é um recurso do plano Pro ou Consultoria.
            </p>
          )}
        </div>
      ),
    },
    {
      // 5. Direcionamento
      icon: PartyPopper,
      content: (
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto"><PartyPopper className="h-7 w-7 text-primary" /></div>
          <div>
            <h2 className="text-lg font-bold">Pronto pra começar!</h2>
            <p className="text-sm text-muted-foreground mt-1">Vamos ver seu primeiro programa?</p>
          </div>
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const current = steps[step];

  const handleNext = async () => {
    if (!isLast) { setStep(s => s + 1); return; }
    await persistAndClose();
    navigate("/student/catalog");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/90 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm flex flex-col overflow-hidden shadow-2xl" style={{ maxHeight: "92dvh" }}>
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-primary" : "w-1.5 bg-muted")} />
            ))}
          </div>
          <button className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0" onClick={persistAndClose} aria-label="Não mostrar novamente">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">{current.content}</div>

        <div className="px-5 pb-5 pt-2 border-t border-border flex items-center gap-2">
          {step > 0 && (
            <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <button className="text-xs text-muted-foreground flex-shrink-0 px-2" onClick={onClose} disabled={saving}>
            Pular
          </button>
          <Button variant="premium" className="flex-1 gap-1.5" onClick={handleNext} disabled={saving}>
            {isLast ? "Ver meu primeiro programa" : "Continuar"}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
