import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

// Extrai o token de recuperação da URL vinda do email do Supabase.
// detectSessionInUrl está desligado no client global (de propósito, pra não
// interferir em outros fluxos de auth), então a sessão de recuperação é
// aberta manualmente aqui, só nesta página.
async function openRecoverySession() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return !error;
  }

  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const access_token = hash.get('access_token');
  const refresh_token = hash.get('refresh_token');
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    return !error;
  }

  return false;
}

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [checking, setChecking] = useState(true);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    openRecoverySession().then(ok => {
      setValidLink(ok);
      setChecking(false);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Santana Method</h1>
        </div>

        {checking ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !validLink ? (
          <div className="space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">Link inválido ou expirado</h2>
              <p className="text-sm text-muted-foreground">Solicite um novo link de redefinição de senha.</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate('/forgot-password')}>
              Solicitar novo link
            </Button>
          </div>
        ) : done ? (
          <div className="space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">Senha atualizada!</h2>
              <p className="text-sm text-muted-foreground">Redirecionando...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-bold text-foreground">Defina sua nova senha</h2>
              <p className="text-muted-foreground text-sm">Escolha uma senha com pelo menos 6 caracteres.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Nova senha
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Confirmar senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-accent/40 border-border text-foreground placeholder:text-muted-foreground/60 h-12 rounded-xl focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-glow"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : 'Salvar nova senha'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
