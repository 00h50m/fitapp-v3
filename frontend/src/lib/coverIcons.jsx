import { Flame, Dumbbell, HeartPulse, Zap, Target, Trophy, Sunrise, PersonStanding, Timer, Medal, Activity, Rocket } from "lucide-react";

// Ícones de capa (jornadas, categorias) — Lucide em vez de emoji do sistema,
// pra ficar consistente com o resto do app (que já usa só Lucide) em vez de
// depender da fonte de emoji de cada SO/navegador.
export const COVER_ICONS = [
  { key: "flame", Icon: Flame, label: "Emagrecimento" },
  { key: "dumbbell", Icon: Dumbbell, label: "Hipertrofia/Força" },
  { key: "heart-pulse", Icon: HeartPulse, label: "Cardio/Condicionamento" },
  { key: "person-standing", Icon: PersonStanding, label: "Mobilidade" },
  { key: "zap", Icon: Zap, label: "HIIT/Energia" },
  { key: "target", Icon: Target, label: "Foco" },
  { key: "trophy", Icon: Trophy, label: "Resultado" },
  { key: "medal", Icon: Medal, label: "Performance" },
  { key: "sunrise", Icon: Sunrise, label: "Rotina" },
  { key: "timer", Icon: Timer, label: "Treino rápido" },
  { key: "activity", Icon: Activity, label: "Geral" },
  { key: "rocket", Icon: Rocket, label: "Evolução" },
];

const ICON_MAP = Object.fromEntries(COVER_ICONS.map(i => [i.key, i.Icon]));

export const DEFAULT_COVER_ICON = "flame";

// Renderiza um ícone Lucide quando "value" é uma chave conhecida; caso
// contrário cai para texto literal (compatível com emoji já salvo antes
// dessa mudança, sem precisar migrar dado nenhum).
export function CoverGlyph({ value, className = "h-6 w-6" }) {
  const Icon = ICON_MAP[value];
  if (Icon) return <Icon className={className} strokeWidth={2} />;
  return <span className={className}>{value}</span>;
}
