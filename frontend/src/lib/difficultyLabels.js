// `color` is for use on theme-aware surfaces (cards, backgrounds).
// `overlayColor` is for use on top of dark image covers (always-dark gradient,
// independent of the site theme), so it stays a light shade in both modes.
export const DIFFICULTY_LABEL = {
  iniciante: { label: "Iniciante", color: "text-green-600 dark:text-green-400", overlayColor: "text-green-400" },
  intermediario: { label: "Intermediário", color: "text-yellow-600 dark:text-yellow-400", overlayColor: "text-yellow-400" },
  avancado: { label: "Avançado", color: "text-red-600 dark:text-red-400", overlayColor: "text-red-400" },
};
