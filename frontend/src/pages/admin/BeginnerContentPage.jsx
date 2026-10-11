import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GraduationCap, Loader2, Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllBeginnerContents, createBeginnerContent, updateBeginnerContent,
  deleteBeginnerContent, reorderBeginnerContents, CONTEXT_LABEL,
} from "@/services/beginnerContentService";

const SEL = "bg-muted border border-border text-foreground rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring";

const ContentRow = ({ item, onChange, onDelete, onMove, isFirst, isLast }) => (
  <div className={`flex items-start gap-3 p-4 rounded-xl border ${item.enabled ? "bg-card border-border" : "bg-muted/30 border-border/50 opacity-70"}`}>
    <div className="flex flex-col gap-0.5 flex-shrink-0 pt-1">
      <button disabled={isFirst} onClick={() => onMove(-1)} className="h-6 w-6 rounded-md bg-muted flex items-center justify-center disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
      <button disabled={isLast} onClick={() => onMove(1)} className="h-6 w-6 rounded-md bg-muted flex items-center justify-center disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
    </div>
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Input value={item.title} onChange={e => onChange({ title: e.target.value })} className="h-8 text-sm font-medium flex-1" />
        <select className={SEL} value={item.context} onChange={e => onChange({ context: e.target.value })}>
          {Object.entries(CONTEXT_LABEL).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
        </select>
        <button
          className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 flex-shrink-0 ${item.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          onClick={() => onChange({ enabled: !item.enabled })}
        >
          {item.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </button>
        <button className="text-muted-foreground hover:text-destructive flex-shrink-0" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      <textarea
        className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        rows={2}
        value={item.body}
        onChange={e => onChange({ body: e.target.value })}
      />
    </div>
  </div>
);

const BeginnerContentPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getAllBeginnerContents()); }
    catch (err) { toast.error("Erro ao carregar: " + err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateItem = (id, fields) => setItems(prev => prev.map(i => i.id === id ? { ...i, ...fields } : i));

  const move = (idx, dir) => {
    setItems(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleAdd = async () => {
    try {
      const created = await createBeginnerContent({
        slug: `conteudo-${Date.now()}`, title: "Novo conteúdo", body: "", context: "geral", order_index: items.length, enabled: true,
      });
      setItems(prev => [...prev, created]);
    } catch (err) { toast.error("Erro ao criar: " + err.message); }
  };

  const handleDelete = async (id) => {
    try { await deleteBeginnerContent(id); setItems(prev => prev.filter(i => i.id !== id)); }
    catch (err) { toast.error("Erro ao excluir: " + err.message); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(items.map(i => updateBeginnerContent(i.id, { title: i.title, body: i.body, context: i.context, enabled: i.enabled })));
      await reorderBeginnerContents(items.map(i => i.id));
      toast.success("Conteúdos salvos!");
    } catch (err) { toast.error("Erro ao salvar: " + err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in max-w-3xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />Área do iniciante
            </h1>
            <p className="text-muted-foreground mt-1">Conteúdos que aparecem em "Comece por aqui" pro aluno.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAdd}><Plus className="h-3.5 w-3.5" />Novo</Button>
            <Button variant="premium" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 space-y-2.5">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum conteúdo cadastrado ainda.</p>
            ) : items.map((item, idx) => (
              <ContentRow
                key={item.id}
                item={item}
                onChange={fields => updateItem(item.id, fields)}
                onDelete={() => handleDelete(item.id)}
                onMove={dir => move(idx, dir)}
                isFirst={idx === 0}
                isLast={idx === items.length - 1}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default BeginnerContentPage;
