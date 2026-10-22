import React from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  HelpCircle, UserPlus, ClipboardList, BookOpen, Users, UserCog, Library,
  CreditCard, Palette, LayoutTemplate, GraduationCap, LayoutDashboard,
  House, Compass, Play, CheckCircle2, ChartNoAxesColumnIncreasing, Sparkles,
} from "lucide-react";

const GuideCard = ({ icon: Icon, title, text, cta, onCta }) => (
  <div className="bg-card rounded-2xl shadow-sm p-4 flex items-start gap-3 border border-border">
    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{text}</p>
      {cta && <button className="text-xs font-medium text-primary mt-2" onClick={onCta}>{cta} →</button>}
    </div>
  </div>
);

const SectionTitle = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 mb-3 mt-8 first:mt-0">
    <Icon className="h-4 w-4 text-primary flex-shrink-0" />
    <p className="text-sm font-semibold text-foreground">{children}</p>
    <div className="flex-1 h-px bg-border/50" />
  </div>
);

const AdminHelpPage = () => {
  const navigate = useNavigate();

  const adminGuides = [
    { icon: UserPlus, title: "Cadastrar um aluno", text: "Crie o acesso do aluno (email, plano, validade). Ele recebe login pra entrar no app.", cta: "Novo aluno", onCta: () => navigate("/admin/alunos/novo") },
    { icon: Library, title: "Cadastrar exercícios", text: "Monte a biblioteca de exercícios (vídeo, GIF, grupo muscular) usada nos treinos.", cta: "Ver exercícios", onCta: () => navigate("/admin/treinos/exercicios") },
    { icon: ClipboardList, title: "Criar um treino padrão", text: "Um template reutilizável: monte blocos de exercícios (séries, reps, descanso) pra usar em vários programas.", cta: "Novo treino padrão", onCta: () => navigate("/admin/treinos/editor/new") },
    { icon: BookOpen, title: "Criar um programa (jornada)", text: "Agrupe treinos padrão numa sequência com nome, capa e dificuldade — é o que o aluno encontra no catálogo.", cta: "Ir ao catálogo", onCta: () => navigate("/admin/catalog") },
    { icon: Users, title: "Liberar acesso a um programa", text: "No catálogo, toque em \"Acessos\" no programa e selecione quais alunos podem vê-lo.", cta: "Ir ao catálogo", onCta: () => navigate("/admin/catalog") },
    { icon: UserCog, title: "Criar treino personalizado", text: "Monte um treino só pra um aluno específico, fora dos programas padrão, com data de início e fim.", cta: "Ver personalizados", onCta: () => navigate("/admin/treinos/personalizados") },
    { icon: CreditCard, title: "Entender os planos", text: "Essencial, Pro e Consultoria liberam funções diferentes (marcar exercício, registrar carga, evolução). Veja o que cada um inclui.", cta: "Ver planos", onCta: () => navigate("/admin/planos") },
    { icon: Palette, title: "Personalizar a identidade visual", text: "Troque logo, cores e nome do app — vale pra tudo, inclusive o que o aluno vê.", cta: "Ir à aparência", onCta: () => navigate("/admin/aparencia") },
    { icon: LayoutTemplate, title: "Editar a página inicial do aluno", text: "Escolha banner, textos e quais seções aparecem na Home do app do aluno.", cta: "Editar página inicial", onCta: () => navigate("/admin/home") },
    { icon: GraduationCap, title: "Editar a área do iniciante", text: "Conteúdo de boas-vindas pra quem está começando do zero.", cta: "Ver área do iniciante", onCta: () => navigate("/admin/conteudos") },
    { icon: LayoutDashboard, title: "Acompanhar seus alunos", text: "A Visão geral mostra atividade recente, alunos sem treino e atalhos pro que precisa de atenção.", cta: "Ver visão geral", onCta: () => navigate("/admin") },
  ];

  const studentFlow = [
    { icon: House, title: "Início", text: "O aluno abre o app e já vê o treino de hoje em destaque, com um botão \"Treinar agora\"." },
    { icon: Compass, title: "Catálogo", text: "Pode explorar outros programas liberados pra ele, organizados por categoria." },
    { icon: Play, title: "Execução do treino", text: "Segue os blocos e exercícios com vídeo/GIF, série por série." },
    { icon: CheckCircle2, title: "Marcar e registrar", text: "Marca cada exercício feito e, dependendo do plano, registra carga e reps de cada série." },
    { icon: ChartNoAxesColumnIncreasing, title: "Evolução", text: "Acompanha frequência, sequência de dias e histórico de cargas (planos Pro/Consultoria)." },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Como usar
          </h1>
          <p className="text-muted-foreground mt-1">Um guia rápido do painel e do que o seu aluno vê do outro lado.</p>
        </div>

        <SectionTitle icon={Sparkles}>Montando seu negócio no app</SectionTitle>
        <div className="space-y-2.5">
          {adminGuides.map(g => <GuideCard key={g.title} {...g} />)}
        </div>

        <SectionTitle icon={House}>O que o aluno vê</SectionTitle>
        <p className="text-xs text-muted-foreground -mt-2 mb-3">Pra você entender a experiência do outro lado, sem precisar logar como aluno.</p>
        <div className="space-y-2.5">
          {studentFlow.map(s => <GuideCard key={s.title} {...s} />)}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHelpPage;
