import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { usePlanPermission, FEATURES, TIER_FEATURES, FEATURE_LABEL, PLAN_TIER_LABEL } from "@/lib/planPermissions";
import { MobileContainer, MobileHeader, MobileContent } from "@/components/layout/MobileContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { OnboardingFlow } from "@/components/student/OnboardingFlow";
import {
  ChevronLeft, Compass, Play, Video, CheckCircle2, Trophy, BarChart2,
  ChartNoAxesColumnIncreasing, FileText, MessageCircle, Layers, Sparkles, Check, Lock,
} from "lucide-react";

const TutorialCard = ({ icon: Icon, title, text, cta, onCta, locked, lockedHint }) => (
  <div className="bg-card rounded-2xl shadow-sm p-4 flex items-start gap-3">
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${locked ? "bg-muted" : "bg-primary/10"}`}>
      {locked ? <Lock className="h-4 w-4 text-muted-foreground/60" /> : <Icon className="h-4 w-4 text-primary" />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{locked ? lockedHint : text}</p>
      {!locked && cta && (
        <button className="text-xs font-medium text-primary mt-2" onClick={onCta}>{cta} →</button>
      )}
    </div>
  </div>
);

const StudentHelpPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { settings } = useAppSettings();
  const perm = usePlanPermission(profile);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const canMark = perm.can(FEATURES.MARK_EXERCISE);
  const canLoad = perm.can(FEATURES.LOAD_LOGGING);

  const tutorials = [
    { icon: Compass, title: "Como encontrar um programa", text: "Veja todos os programas disponíveis, organizados por categoria.", cta: "Ver programas", onCta: () => navigate("/student/catalog") },
    { icon: Play, title: "Como iniciar um treino", text: "Toque em \"Treinar agora\" na Início, ou na aba Treino do menu.", cta: "Ir treinar", onCta: () => navigate("/student/train") },
    { icon: Video, title: "Como assistir ao vídeo do exercício", text: "Dentro do treino, toque em \"Vídeo\" ou \"GIF\" em cada exercício.", cta: "Ver meu treino", onCta: () => navigate("/student/train") },
    { icon: CheckCircle2, title: "Como marcar um exercício", text: "Toque no círculo ao lado do exercício quando terminar.", cta: "Ir treinar", onCta: () => navigate("/student/train"), locked: !canMark, lockedHint: `Disponível no plano ${perm.minTierLabelFor(FEATURES.MARK_EXERCISE)} ou superior.` },
    { icon: Trophy, title: "Como finalizar o treino", text: "No final, toque em \"Finalizar Treino\" na parte de baixo da tela.", cta: "Ir treinar", onCta: () => navigate("/student/train"), locked: !perm.can(FEATURES.FINISH_WORKOUT), lockedHint: `Disponível no plano ${perm.minTierLabelFor(FEATURES.FINISH_WORKOUT)} ou superior.` },
    { icon: BarChart2, title: "Como registrar carga", text: "Toque em \"Registrar cargas\" no exercício e anote peso e repetições de cada série.", cta: "Ir treinar", onCta: () => navigate("/student/train"), locked: !canLoad, lockedHint: `Disponível no plano ${perm.minTierLabelFor(FEATURES.LOAD_LOGGING)}.` },
    { icon: ChartNoAxesColumnIncreasing, title: "Como acompanhar seu progresso", text: "Veja frequência, sequência e histórico na aba Evolução.", cta: "Ver evolução", onCta: () => navigate("/student/evolution"), locked: !perm.can(FEATURES.FREQUENCY_TRACKING), lockedHint: `Disponível no plano ${perm.minTierLabelFor(FEATURES.FREQUENCY_TRACKING)} ou superior.` },
    { icon: FileText, title: "Como acessar o PDF do treino", text: "Toque no ícone de PDF no topo da tela do treino, quando disponível.", cta: "Ir treinar", onCta: () => navigate("/student/train") },
    { icon: MessageCircle, title: "Como falar com o personal", text: "Toque aqui pra abrir o WhatsApp direto.", cta: "Abrir WhatsApp", onCta: () => window.open(`https://wa.me/${settings.whatsapp}`, "_blank") },
  ];

  return (
    <MobileContainer className="pb-24">
      <MobileHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2" onClick={() => navigate("/student/profile")}><ChevronLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl font-semibold">Aprenda a usar</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Tutoriais rápidos de cada função do app</p>
          </div>
        </div>
      </MobileHeader>

      <MobileContent>
        <button
          type="button"
          onClick={() => setShowOnboarding(true)}
          className="w-full flex items-center gap-3 rounded-2xl bg-primary/5 border border-primary/20 p-4 text-left mb-5"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Sparkles className="h-4 w-4 text-primary" /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Ver boas-vindas novamente</p>
            <p className="text-xs text-muted-foreground mt-0.5">A apresentação rápida de quando você entrou pela primeira vez</p>
          </div>
        </button>

        <div className="space-y-2.5 mb-6">
          {tutorials.map(t => <TutorialCard key={t.title} {...t} />)}
        </div>

        {/* Diferenças entre os planos */}
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-sm font-semibold">Diferenças entre os planos</p>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="space-y-3">
          {Object.keys(TIER_FEATURES).map(tier => {
            const isCurrent = tier === perm.tier;
            return (
              <div key={tier} className={`rounded-2xl p-4 border ${isCurrent ? "bg-primary/5 border-primary/30" : "bg-card border-border"}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold">{PLAN_TIER_LABEL[tier]}</p>
                  {isCurrent && <span className="text-[10px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">Seu plano</span>}
                </div>
                <div className="space-y-1.5">
                  {TIER_FEATURES[tier].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs">
                      <Check className="h-3 w-3 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{FEATURE_LABEL[f]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </MobileContent>

      {showOnboarding && <OnboardingFlow profile={profile} onClose={() => setShowOnboarding(false)} />}
      <BottomNav />
    </MobileContainer>
  );
};

export default StudentHelpPage;
