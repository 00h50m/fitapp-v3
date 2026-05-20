import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getStudentJourneys } from "@/services/journeyService";
import { ChevronRight, Zap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const JourneyProgress = ({ studentId: propStudentId }) => {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let sid = propStudentId;
        if (!sid) {
          const { data: { user } } = await supabase.auth.getUser();
          const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
          sid = profile.id;
        }
        const sjs = await getStudentJourneys(sid);
        setActive(sjs.find(sj => sj.status === "active") ?? null);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [propStudentId]);

  if (loading) return null;

  if (!active) {
    return (
      <button onClick={() => navigate("/student/catalog")} className="w-full flex items-center gap-3 bg-secondary rounded-xl px-4 py-3 hover:bg-secondary/80 transition-all text-left">
        <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Explorar jornadas</p>
          <p className="text-xs text-muted-foreground">Escolha um programa e comece hoje</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  }

  const j = active.journey;
  const total = j?.journey_workouts?.[0]?.count ?? 0;
  const completed = active.completed_workouts ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <button onClick={() => navigate("/student/catalog")} className="w-full bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all text-left">
      <div className="h-1.5 w-full" style={{ background: j?.cover_color ?? "#1D9E75" }} />
      <div className="p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: j?.cover_color ?? "#0F6E56" }}>
          {j?.cover_emoji ?? "⚡"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Zap className="h-3 w-3 text-primary flex-shrink-0" />
            <p className="text-xs text-primary font-medium truncate">Jornada ativa</p>
          </div>
          <p className="text-sm font-medium truncate">{j?.title}</p>
          <div className="mt-1.5">
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Dia {completed} de {total} · {progress}%</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
};

export default JourneyProgress;
