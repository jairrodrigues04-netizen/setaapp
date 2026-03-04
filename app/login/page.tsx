"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useStore } from "@/store/use-store";
import { 
  auth, 
  googleProvider, 
  microsoftProvider, 
  isConfigured 
} from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          id: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "Usuário",
          email: user.email || "",
          avatar: user.photoURL || undefined,
        });
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router, setUser]);

  const handleError = (err: any) => {
    console.error(err);
    if (err.code === "auth/invalid-credential") {
      setError("E-mail ou senha incorretos.");
    } else if (err.code === "auth/email-already-in-use") {
      setError("Este e-mail já está em uso.");
    } else if (err.code === "auth/weak-password") {
      setError("A senha deve ter pelo menos 6 caracteres.");
    } else if (err.code === "auth/user-not-found") {
      setError("Usuário não encontrado.");
    } else if (err.code === "auth/popup-closed-by-user") {
      setError("O login foi cancelado.");
    } else {
      setError("Ocorreu um erro. Tente novamente.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError("Firebase não configurado. Adicione as variáveis de ambiente.");
      return;
    }
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // onAuthStateChanged will handle the redirect
    } catch (err: any) {
      handleError(err);
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: "google" | "microsoft") => {
    if (!auth) {
      setError("Firebase não configurado. Adicione as variáveis de ambiente.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const provider = providerName === "google" ? googleProvider : microsoftProvider;
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the redirect
    } catch (err: any) {
      handleError(err);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError("Firebase não configurado.");
      return;
    }
    if (!email) return;

    setIsLoading(true);
    setError(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setForgotPasswordSent(true);
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <main className="flex-1 min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-sm space-y-8 z-10">
          <button 
            onClick={() => {
              setIsForgotPassword(false);
              setForgotPasswordSent(false);
              setError(null);
            }}
            className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:opacity-90 transition-opacity mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Recuperar senha</h1>
            <p className="text-foreground/60 font-medium">
              {forgotPasswordSent 
                ? "Enviamos um link de recuperação para o seu e-mail."
                : "Digite seu e-mail para receber um link de recuperação."}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-negative/10 text-negative rounded-2xl flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!forgotPasswordSent && (
            <form className="space-y-6" onSubmit={handleForgotPassword}>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-foreground/40" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  className="w-full bg-card border border-black/10 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 font-medium outline-none focus:border-foreground transition-colors"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-foreground text-background py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-xl shadow-foreground/10 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar link"}
              </button>
            </form>
          )}

          {forgotPasswordSent && (
            <button 
              onClick={() => {
                setIsForgotPassword(false);
                setForgotPasswordSent(false);
                setError(null);
              }}
              className="w-full bg-foreground text-background py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-xl shadow-foreground/10"
            >
              Voltar para o login
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-sm space-y-8 z-10">
        {/* Logo Placeholder */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-6 transition-transform duration-300">
            <span className="text-5xl font-black text-white -rotate-3">S</span>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Seta</h1>
            <p className="text-foreground/60 font-medium">
              {isSignUp ? "Crie sua conta agora" : "Coloque seu dinheiro na direção certa"}
            </p>
          </div>
        </div>

        {!isConfigured && (
          <div className="p-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-start gap-2 text-sm font-medium border border-amber-500/20">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>O Firebase não está configurado.</p>
              <p className="text-xs opacity-80">Adicione as variáveis de ambiente no arquivo .env para ativar o login.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-negative/10 text-negative rounded-2xl flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleEmailAuth}>
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-foreground/40" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail"
                className="w-full bg-card border border-black/10 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 font-medium outline-none focus:border-foreground transition-colors"
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-foreground/40" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="w-full bg-card border border-black/10 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 font-medium outline-none focus:border-foreground transition-colors"
              />
            </div>
          </div>

          {!isSignUp && (
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => {
                  setIsForgotPassword(true);
                  setError(null);
                }}
                className="text-sm font-bold text-foreground/60 hover:text-foreground transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isLoading || !email || !password || !isConfigured}
              className="w-full bg-foreground text-background py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-xl shadow-foreground/10 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isSignUp ? "Criar conta" : "Entrar na minha conta"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-black/10 dark:border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-foreground/40 text-sm font-medium">ou entre com</span>
          <div className="flex-grow border-t border-black/10 dark:border-white/10"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={() => handleSocialLogin("google")}
            disabled={isLoading || !isConfigured}
            className="flex items-center justify-center gap-2 bg-card border border-black/10 dark:border-white/10 py-3 rounded-2xl font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button 
            type="button"
            onClick={() => handleSocialLogin("microsoft")}
            disabled={isLoading || !isConfigured}
            className="flex items-center justify-center gap-2 bg-card border border-black/10 dark:border-white/10 py-3 rounded-2xl font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.4 24L0 20.4V3.6L11.4 0V24Z" fill="#0078D4"/>
              <path d="M24 22.8L11.4 24V0L24 1.2V22.8Z" fill="#28A8EA"/>
              <path d="M11.4 12L0 15.6V8.4L11.4 12Z" fill="#005A9E"/>
              <path d="M24 12L11.4 15.6V8.4L24 12Z" fill="#107C41"/>
            </svg>
            Outlook
          </button>
        </div>

        {/* Toggle Login/Signup */}
        <div className="text-center pt-4">
          <p className="text-sm text-foreground/60">
            {isSignUp ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="font-bold text-foreground hover:underline"
            >
              {isSignUp ? "Fazer login" : "Criar agora"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
