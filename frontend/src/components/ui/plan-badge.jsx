import React from "react";
import { Badge } from "@/components/ui/badge";
import { getPlanTier, PLAN_TIER_LABEL } from "@/lib/planPermissions";

const TIER_VARIANT = {
  essencial: "outline",
  pro: "secondary",
  consultoria: "premium",
};

export function PlanBadge({ planValue, className }) {
  const tier = getPlanTier(planValue);
  return (
    <Badge variant={TIER_VARIANT[tier]} className={className}>
      {PLAN_TIER_LABEL[tier]}
    </Badge>
  );
}

export default PlanBadge;
