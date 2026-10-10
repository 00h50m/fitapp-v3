import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { House, Library, Dumbbell, ChartNoAxesColumnIncreasing, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/student", label: "Início", icon: House, match: (p) => p === "/student" },
  { to: "/student/catalog", label: "Jornadas", icon: Library, match: (p) => p.startsWith("/student/catalog") || p.startsWith("/student/journey") },
  { to: "/student/train", label: "Treino", icon: Dumbbell, match: (p) => p.startsWith("/student/train") || p.startsWith("/student/workout/") },
  { to: "/student/evolution", label: "Evolução", icon: ChartNoAxesColumnIncreasing, match: (p) => p.startsWith("/student/evolution") },
  { to: "/student/profile", label: "Perfil", icon: User, match: (p) => p.startsWith("/student/profile") },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
      {ITEMS.map(({ to, label, icon: Icon, match }) => {
        const active = match(location.pathname);
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
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
