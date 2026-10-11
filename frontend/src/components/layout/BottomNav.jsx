import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { House, Library, Dumbbell, ChartNoAxesColumnIncreasing, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const ITEMS = [
  { to: "/student", label: "Início", icon: House, match: (p) => p === "/student" },
  { to: "/student/catalog", label: "Jornadas", icon: Library, match: (p) => p.startsWith("/student/catalog") || p.startsWith("/student/journey") },
  { to: "/student/train", label: "Treino", icon: Dumbbell, match: (p) => p.startsWith("/student/train") || p.startsWith("/student/workout/"), highlightKey: "workout" },
  { to: "/student/evolution", label: "Evolução", icon: ChartNoAxesColumnIncreasing, match: (p) => p.startsWith("/student/evolution") },
  { to: "/student/profile", label: "Perfil", icon: User, match: (p) => p.startsWith("/student/profile") },
];

function isExpiredWorkout(w) { if (!w.end_date) return false; return new Date(w.end_date + "T23:59:59") < new Date(); }

// Só pra decidir se mostra o pontinho de destaque em "Treino" — consulta
// bem leve, não reaproveita o carregamento pesado da Home.
async function checkWorkoutAvailable(userId) {
  const { data: workouts } = await supabase.from("student_workouts").select("id, end_date").eq("student_id", userId).eq("status", "active");
  if ((workouts || []).some(w => !isExpiredWorkout(w))) return true;
  const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", userId).maybeSingle();
  if (!profile) return false;
  const { data: sj } = await supabase.from("student_journeys").select("id").eq("student_id", profile.id).eq("status", "active").limit(1);
  return (sj || []).length > 0;
}

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [workoutAvailable, setWorkoutAvailable] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    checkWorkoutAvailable(user.id).then(v => { if (!cancelled) setWorkoutAvailable(v); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 mx-auto w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
        "grid grid-cols-5 gap-1",
        "border-t border-border bg-background/95 backdrop-blur-lg",
        "px-2 pt-2 pb-safe-bottom"
      )}
    >
      {ITEMS.map(({ to, label, icon: Icon, match, highlightKey }) => {
        const active = match(location.pathname);
        const highlight = highlightKey === "workout" && workoutAvailable && !active;
        return (
          <button
            key={to}
            type="button"
            onClick={() => navigate(to)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {highlight && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />}
            </span>
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
