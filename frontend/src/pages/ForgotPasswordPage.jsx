import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Erro ao solicitar redefinição de senha');
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

        {sent ? (
          <div className="space-y-5 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">Email enviado</h2>
              <p className="text-sm text-muted-foreground">
                Se existir uma conta com o email <strong className="text-foreground">{email}</strong>, você vai receber um link para redefinir sua senha.
              </p>
            </div>
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" />Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-bold text-foreground">Esqueceu sua senha?</h2>
              <p className="text-muted-foreground text-sm">Informe seu email e enviaremos um link para redefinir sua senha.</p>
            </div>

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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-glow"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enviando...</> : 'Enviar link de redefinição'}
              </Button>
            </form>

            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />Voltar para o login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
