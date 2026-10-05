import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setTimeout(() => { navigate('/', { replace: true }); }, 50);
    } catch (err) {
      if (err.message.includes('Invalid login')) {
        setError('Email ou senha inválidos');
      } else {
        setError(err.message || 'Erro ao fazer login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Lado esquerdo — visual ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Fundo gradiente com padrão */}
        <div className="absolute inset-0" style={{ background: 'var(--gradient-body)' }} />

        {/* Grade decorativa */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.8) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.8) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Glow central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)' }}
        />

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo topo */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-foreground font-bold text-lg tracking-tight">Santana Method</span>
          </div>

          {/* Texto central */}
          <div className="space-y-6">
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                  Consultoria Personalizada
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-accent/50 text-muted-foreground border border-border">
                  Premium
                </span>
              </div>

              <h1 className="text-5xl font-bold text-foreground leading-tight">
                Transforme<br />
                seu <span className="text-primary">corpo</span><br />
                e sua vida.
              </h1>

              <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
                Acompanhamento individualizado, jornadas de treino e evolução contínua — tudo em um só lugar.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              {[
                { value: "100%", label: "Personalizado" },
                { value: "24/7", label: "Disponível" },
                { value: "∞", label: "Evolução" },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <p className="text-muted-foreground/70 text-xs">© 2025 Santana Method. Todos os direitos reservados.</p>
        </div>

        {/* Linha vertical divisória com glow */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
      </div>

      {/* ── Lado direito — formulário ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-8">

          {/* Logo mobile */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg">
              <Zap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Santana Method</h1>
          </div>

          {/* Header desktop */}
          <div className="hidden lg:block space-y-1">
            <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-muted-foreground text-sm">Entre com suas credenciais para continuar</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-accent/40 border-border text-foreground placeholder:text-muted-foreground/60 h-12 rounded-xl focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-accent/40 border-border text-foreground placeholder:text-muted-foreground/60 h-12 rounded-xl focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-glow hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Entrando...</>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Linha decorativa */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground/70 text-xs">Santana Method</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-muted-foreground/70 text-xs">
            Acesso exclusivo para alunos cadastrados.<br />
            Entre em contato com seu personal para obter acesso.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
