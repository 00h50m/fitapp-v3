// Estrutura centralizada de permissões por plano.
// Mapeamento 1:1 dos valores já existentes em profiles.plan — sem migrar dados.
export const PLAN_TIER_BY_VALUE = {
  basic: "essencial",
  premium: "pro",
  vip: "consultoria",
};

export const PLAN_TIER_LABEL = {
  essencial: "Essencial",
  pro: "Pro",
  consultoria: "Consultoria",
};

// Rótulos de exibição por valor bruto do banco (profiles.plan), já usando os novos nomes.
export const PLAN_VALUE_LABEL = {
  basic: "Essencial",
  premium: "Pro",
  vip: "Consultoria",
};

export const FEATURES = {
  VIEW_CONTENT: "view_content",         // PDF, vídeo, instruções, séries/reps
  SAVE_PROGRAM: "save_program",         // salvar/favoritar programa
  MARK_EXERCISE: "mark_exercise",       // marcar exercício como feito
  FINISH_WORKOUT: "finish_workout",     // finalizar sessão de treino
  FREQUENCY_TRACKING: "frequency_tracking", // frequência / sequência semanal
  SESSION_HISTORY: "session_history",   // histórico básico de sessões concluídas
  LOAD_LOGGING: "load_logging",         // registrar carga/reps por série
  LOAD_HISTORY: "load_history",         // histórico de cargas por exercício
  PHOTOS_MEASUREMENTS: "photos_measurements", // fotos e medidas de evolução
  COACH_FEEDBACK: "coach_feedback",     // feedback do personal
  CHAT: "chat",                         // chat direto com o personal
};

export const FEATURE_LABEL = {
  [FEATURES.VIEW_CONTENT]: "PDF, vídeos e instruções dos exercícios",
  [FEATURES.SAVE_PROGRAM]: "Salvar programas e treinos",
  [FEATURES.MARK_EXERCISE]: "Marcar exercícios como concluídos",
  [FEATURES.FINISH_WORKOUT]: "Iniciar e finalizar treino",
  [FEATURES.FREQUENCY_TRACKING]: "Frequência, sequência e jornadas",
  [FEATURES.SESSION_HISTORY]: "Histórico de sessões concluídas",
  [FEATURES.LOAD_LOGGING]: "Registro de carga e repetições por série",
  [FEATURES.LOAD_HISTORY]: "Histórico de cargas por exercício",
  [FEATURES.PHOTOS_MEASUREMENTS]: "Fotos e medidas de evolução",
  [FEATURES.COACH_FEEDBACK]: "Feedback do personal",
  [FEATURES.CHAT]: "Chat direto com o personal",
};

export const TIER_FEATURES = {
  essencial: [
    FEATURES.VIEW_CONTENT,
    FEATURES.SAVE_PROGRAM,
  ],
  pro: [
    FEATURES.VIEW_CONTENT,
    FEATURES.SAVE_PROGRAM,
    FEATURES.MARK_EXERCISE,
    FEATURES.FINISH_WORKOUT,
    FEATURES.FREQUENCY_TRACKING,
    FEATURES.SESSION_HISTORY,
  ],
  consultoria: [
    FEATURES.VIEW_CONTENT,
    FEATURES.SAVE_PROGRAM,
    FEATURES.MARK_EXERCISE,
    FEATURES.FINISH_WORKOUT,
    FEATURES.FREQUENCY_TRACKING,
    FEATURES.SESSION_HISTORY,
    FEATURES.LOAD_LOGGING,
    FEATURES.LOAD_HISTORY,
    FEATURES.PHOTOS_MEASUREMENTS,
    FEATURES.COACH_FEEDBACK,
    FEATURES.CHAT,
  ],
};

// Sem plano definido = tratado como o nível mais restrito (nunca libera por omissão).
export function getPlanTier(planValue) {
  return PLAN_TIER_BY_VALUE[planValue] || "essencial";
}

export function canUseFeature(planValue, feature) {
  const tier = getPlanTier(planValue);
  return TIER_FEATURES[tier]?.includes(feature) ?? false;
}

// Menor tier (entre os definidos) que já libera a feature — usado nas mensagens de bloqueio.
export function minTierForFeature(feature) {
  return Object.keys(TIER_FEATURES).find(tier => TIER_FEATURES[tier].includes(feature)) || null;
}

// Features que o tier adiciona em relação ao tier anterior — usado nas
// telas que exibem "o que cada plano libera" (ex.: admin/PlansPage).
const TIER_ORDER = ["essencial", "pro", "consultoria"];
export function getTierOwnFeatures(tier) {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx <= 0) return TIER_FEATURES[tier] || [];
  const previous = new Set(TIER_FEATURES[TIER_ORDER[idx - 1]] || []);
  return (TIER_FEATURES[tier] || []).filter(f => !previous.has(f));
}

export function usePlanPermission(profile) {
  const planValue = profile?.plan;
  const tier = getPlanTier(planValue);
  return {
    planValue,
    tier,
    tierLabel: PLAN_TIER_LABEL[tier],
    can: (feature) => canUseFeature(planValue, feature),
    minTierLabelFor: (feature) => {
      const minTier = minTierForFeature(feature);
      return minTier ? PLAN_TIER_LABEL[minTier] : null;
    },
  };
}
