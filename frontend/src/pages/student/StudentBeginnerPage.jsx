import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MobileContainer, MobileHeader, MobileContent } from "@/components/layout/MobileContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronDown, Compass, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBeginnerContents, CONTEXT_LABEL } from "@/services/beginnerContentService";
import { ListSkeleton } from "@/components/student/LoadingSkeletons";

const StudentBeginnerPage = () => {
  const navigate = useNavigate();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [expanded, setExpanded] = useState(new Set());

  const load = useCallback(async () => {
    try { setContents(await getBeginnerContents()); }
    catch { /* sem conteúdo cadastrado ainda */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const contexts = [...new Set(contents.map(c => c.context))];
  const filtered = activeFilter === "all" ? contents : contents.filter(c => c.context === activeFilter);

  const toggle = (id) => setExpanded(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  return (
    <MobileContainer className="pb-24">
      <MobileHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2" onClick={() => navigate("/student")}><ChevronLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl font-semibold">Comece por aqui</h1>
            <p className="text-xs text-muted-foreground mt-0.5">O essencial antes do seu primeiro treino</p>
          </div>
        </div>
      </MobileHeader>

      <MobileContent>
        {loading ? (
          <ListSkeleton rows={5} />
        ) : contents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Compass className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Seu personal ainda não cadastrou conteúdos aqui.</p>
          </div>
        ) : (
          <>
            {contexts.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
                <button
                  className={cn("flex-shrink-0 text-xs font-medium rounded-full px-3 py-1.5", activeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                  onClick={() => setActiveFilter("all")}
                >
                  Tudo
                </button>
                {contexts.map(ctx => (
                  <button
                    key={ctx}
                    className={cn("flex-shrink-0 text-xs font-medium rounded-full px-3 py-1.5", activeFilter === ctx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                    onClick={() => setActiveFilter(ctx)}
                  >
                    {CONTEXT_LABEL[ctx] || ctx}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2.5">
              {filtered.map(c => {
                const isOpen = expanded.has(c.id);
                return (
                  <div key={c.id} className="bg-card rounded-2xl shadow-sm overflow-hidden">
                    <button className="w-full flex items-center justify-between gap-3 p-4 text-left" onClick={() => toggle(c.id)}>
                      <span className="text-sm font-semibold">{c.title}</span>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button variant="premium" className="w-full gap-2 mt-6" onClick={() => navigate("/student/catalog")}>
              Ver programas para iniciantes<ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </MobileContent>

      <BottomNav />
    </MobileContainer>
  );
};

export default StudentBeginnerPage;
