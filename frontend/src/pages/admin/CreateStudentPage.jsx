import React, { useState } from "react";
import { supabase, supabaseUrl, supabaseAnonKey } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, ArrowLeft } from "lucide-react";

const CreateStudentPage = () => {
  const navigate = useNavigate();
  const { setIgnoreNextSignIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    birth_date: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    goal: "",
    training_level: "beginner",
    plan: "basic",
    access_start: "",
    access_end: "",
    injuries: "",
    emergency_contact: "",
    notes: "",
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const maskPhone = (value) => {
    let v = value.replace(/\D/g, "");
    if (v.length <= 10) {
      v = v.replace(/(\d{2})(\d)/, "($1) $2");
      v = v.replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      v = v.replace(/(\d{2})(\d)/, "($1) $2");
      v = v.replace(/(\d{5})(\d)/, "$1-$2");
    }
    return v.slice(0, 15);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Nome, email e senha são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      // Usa a REST API diretamente para criar o usuário sem afetar a sessão atual
      // Endpoint: POST /auth/v1/admin/users — requer service role key
      // Como não temos service role no frontend, usamos signUp mas salvamos
      // a sessão do admin antes e restauramos depois

      // Bloqueia o listener de auth para não redirecionar o admin
      setIgnoreNextSignIn();

      // Salva sessão atual do admin
      const { data: { session: adminSession } } = await supabase.auth.getSession();

      // Cria o usuário via fetch direto (não altera sessão atual)
      const signUpRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
        },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const signUpData = await signUpRes.json();
      if (!signUpRes.ok) throw new Error(signUpData.message || signUpData.error_description || "Erro ao criar usuário");

      const userId = signUpData.id || signUpData.user?.id;
      if (!userId) throw new Error("Erro ao obter ID do usuário criado.");

      // Restaura sessão do admin (caso o signUp tenha alterado)
      if (adminSession?.access_token) {
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        });
      }

      // Aguarda o trigger criar o profile (até 3 tentativas)
      const profileData = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        goal: form.goal || null,
        training_level: form.training_level,
        plan: form.plan,
        access_start: form.access_start || null,
        access_end: form.access_end || null,
        injuries: form.injuries || null,
        emergency_contact: form.emergency_contact || null,
        notes: form.notes || null,
        role: "student",
        is_active: true,
      };

      // Tenta atualizar até 4x com delay crescente (trigger pode demorar)
      let updated = false;
      for (let attempt = 1; attempt <= 4; attempt++) {
        await new Promise(r => setTimeout(r, attempt * 600));

        // Verifica se o profile já existe
        const { data: existing } = await supabase
          .from("profiles")
          .select("id, user_id")
          .or(`id.eq.${userId},user_id.eq.${userId}`)
          .maybeSingle();

        if (!existing) continue; // trigger ainda não rodou

        // Atualiza pelo campo que encontrou
        const matchField = existing.user_id === userId ? "user_id" : "id";
        const { error: upErr, count } = await supabase
          .from("profiles")
          .update(profileData)
          .eq(matchField, userId)
          .select();

        if (!upErr) { updated = true; break; }
      }

      if (!updated) {
        // Última tentativa: INSERT direto
        await supabase.from("profiles").insert({
          id: userId,
          user_id: userId,
          ...profileData,
        });
      }

      toast.success("Aluno criado! Já pode liberar jornadas pra ele aqui embaixo.");
      navigate(`/admin/alunos/${userId}`);
    } catch (err) {
      toast.error(err.message || "Erro ao criar aluno.");
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto space-y-4 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin/alunos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Novo Aluno</h1>
            <p className="text-xs text-muted-foreground">Preencha os dados para criar a conta</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Dados da Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">

              {/* Conta */}
              <div className="grid gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Nome completo *</Label>
                  <Input value={form.name} onChange={e => handleChange("name", e.target.value)} required />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Email *</Label>
                  <Input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} required />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Senha *</Label>
                  <Input type="password" value={form.password} onChange={e => handleChange("password", e.target.value)} required minLength={6} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Telefone</Label>
                  <Input value={form.phone} onChange={e => handleChange("phone", maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
                </div>
              </div>

              <hr className="border-border" />

              {/* Dados pessoais */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados Pessoais</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Nascimento</Label>
                  <Input type="date" value={form.birth_date} onChange={e => handleChange("birth_date", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Gênero</Label>
                  <select className={selectClass} value={form.gender} onChange={e => handleChange("gender", e.target.value)}>
                    <option value="">Selecione</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Prefiro não dizer">Prefiro não dizer</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Altura (cm)</Label>
                  <Input type="number" min="0" step="1" value={form.height_cm} onChange={e => handleChange("height_cm", e.target.value)} placeholder="170" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Peso (kg)</Label>
                  <Input type="number" min="0" step="0.1" value={form.weight_kg} onChange={e => handleChange("weight_kg", e.target.value)} placeholder="70" />
                </div>
              </div>

              <hr className="border-border" />

              {/* Plano */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plano & Acesso</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Objetivo</Label>
                  <select className={selectClass} value={form.goal} onChange={e => handleChange("goal", e.target.value)}>
                    <option value="">Selecione</option>
                    <option value="Emagrecimento">Emagrecimento</option>
                    <option value="Hipertrofia">Hipertrofia</option>
                    <option value="Condicionamento">Condicionamento</option>
                    <option value="Reabilitação">Reabilitação</option>
                    <option value="Saúde geral">Saúde geral</option>
                    <option value="Performance">Performance</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Nível de Treino</Label>
                  <select className={selectClass} value={form.training_level} onChange={e => handleChange("training_level", e.target.value)}>
                    <option value="beginner">Iniciante</option>
                    <option value="intermediate">Intermediário</option>
                    <option value="advanced">Avançado</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Plano</Label>
                  <select className={selectClass} value={form.plan} onChange={e => handleChange("plan", e.target.value)}>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Início do Plano</Label>
                  <Input type="date" value={form.access_start} onChange={e => handleChange("access_start", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Fim do Plano</Label>
                  <Input type="date" value={form.access_end} onChange={e => handleChange("access_end", e.target.value)} />
                </div>
              </div>

              <hr className="border-border" />

              {/* Saúde */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saúde & Observações</p>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Lesões</Label>
                <Input value={form.injuries} onChange={e => handleChange("injuries", e.target.value)} placeholder="Ex: joelho direito, lombar..." />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Contato de Emergência</Label>
                <Input value={form.emergency_contact} onChange={e => handleChange("emergency_contact", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Observações</Label>
                <textarea
                  className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  value={form.notes}
                  onChange={e => handleChange("notes", e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" variant="premium" disabled={loading}>
                {loading ? "Criando..." : "Criar Aluno"}
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CreateStudentPage;