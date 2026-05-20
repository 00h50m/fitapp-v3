import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getStudentsWithAccessStatus, grantJourneyAccess, revokeJourneyAccess } from "@/services/journeyService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Lock, Unlock, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const JourneyAccessModal = ({ journey, onClose }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStudentsWithAccessStatus(journey.id);
      setStudents(data);
    } catch (err) {
      toast.error("Erro ao carregar alunos: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [journey.id]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (student) => {
    setToggling(t => ({ ...t, [student.id]: true }));
    try {
      if (student.hasAccess) {
        await revokeJourneyAccess(journey.id, student.id);
        toast.success(`Acesso de ${student.full_name} revogado.`);
      } else {
        await grantJourneyAccess(journey.id, student.id);
        toast.success(`${student.full_name} agora tem acesso! ✅`);
      }
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, hasAccess: !s.hasAccess } : s));
    } catch (err) {
      toast.error("Erro: " + err.message);
    } finally {
      setToggling(t => ({ ...t, [student.id]: false }));
    }
  };

  const handleGrantAll = async () => {
    const withoutAccess = students.filter(s => !s.hasAccess);
    if (!withoutAccess.length) return;
    if (!confirm(`Liberar para todos os ${withoutAccess.length} alunos sem acesso?`)) return;
    for (const s of withoutAccess) { await grantJourneyAccess(journey.id, s.id).catch(() => {}); }
    setStudents(prev => prev.map(s => ({ ...s, hasAccess: true })));
    toast.success("Acesso liberado para todos!");
  };

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const withAccess = students.filter(s => s.hasAccess).length;
  const withoutAccess = students.filter(s => !s.hasAccess).length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="h-14 rounded-xl flex items-center justify-center text-3xl mb-2 flex-shrink-0" style={{ background: journey.cover_color }}>{journey.cover_emoji}</div>
          <DialogTitle className="text-base">Gerenciar acesso</DialogTitle>
          <DialogDescription className="text-xs">{journey.title}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 my-2 flex-shrink-0">
          <div className="bg-secondary rounded-lg p-2 text-center">
            <p className="text-sm font-medium text-green-400">{withAccess}</p>
            <p className="text-xs text-muted-foreground">Com acesso</p>
          </div>
          <div className="bg-secondary rounded-lg p-2 text-center">
            <p className="text-sm font-medium text-muted-foreground">{withoutAccess}</p>
            <p className="text-xs text-muted-foreground">Sem acesso</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar aluno..." className="pl-8 h-8 text-sm bg-secondary border-border" />
          </div>
          {withoutAccess > 0 && <Button variant="outline" size="sm" className="h-8 text-xs whitespace-nowrap" onClick={handleGrantAll}>Liberar todos</Button>}
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0 mt-1">
          {loading && <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum aluno encontrado.</p>
            </div>
          )}
          {!loading && filtered.map(student => (
            <div key={student.id} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all", student.hasAccess ? "bg-green-500/8" : "bg-secondary")}>
              <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-medium flex-shrink-0">
                {(student.full_name?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{student.full_name ?? "Sem nome"}</p>
                <p className="text-xs text-muted-foreground truncate">{student.email}</p>
              </div>
              <div className="flex-shrink-0 mr-1">
                {student.hasAccess ? <Unlock className="h-3.5 w-3.5 text-green-400" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              {toggling[student.id] ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
              ) : (
                <Switch checked={student.hasAccess} onCheckedChange={() => handleToggle(student)} className="flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
        <Button variant="ghost" className="mt-2 flex-shrink-0" onClick={onClose}>Fechar</Button>
      </DialogContent>
    </Dialog>
  );
};

export default JourneyAccessModal;
