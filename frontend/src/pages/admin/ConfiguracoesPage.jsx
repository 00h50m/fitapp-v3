import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ConfiguracoesPage = () => {
  const { user, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("A senha precisa ter pelo menos 6 caracteres."); return; }
    if (password !== confirmPassword) { toast.error("As senhas não coincidem."); return; }
    setSaving(true);
    try {
      await updatePassword(password);
      toast.success("Senha atualizada!");
      setPassword(""); setConfirmPassword("");
    } catch (err) {
      toast.error(err.message || "Erro ao atualizar senha");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">Dados de acesso da sua conta.</p>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border max-w-md space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted border-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nova senha</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={saving}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Confirmar nova senha</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={saving}
                className="bg-background border-border"
              />
            </div>
            <Button type="submit" disabled={saving || !password} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar senha
            </Button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ConfiguracoesPage;
