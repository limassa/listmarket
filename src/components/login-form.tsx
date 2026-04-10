"use client";

import { createClient } from "@/lib/supabase/client";
import { mensagemErroAutenticacao } from "@/lib/auth-mensagens";
import { publicAppOriginFromWindow } from "@/lib/public-origin";
import {
  KeyRound,
  Loader2,
  LogIn,
  Mail,
  Sparkles,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const LIZ_SITE = "https://lizsoftware.com.br";

function normalizarEmail(v: string) {
  return v.trim().toLowerCase();
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const erroUrl = searchParams.get("erro");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [mensagem, setMensagem] = useState<string | null>(
    erroUrl === "auth"
      ? "Não foi possível concluir o login. Tente de novo."
      : null
  );

  async function enviarLink(e: React.FormEvent) {
    e.preventDefault();
    setMensagem(null);
    setStatus("loading");
    const supabase = createClient();
    const origin = publicAppOriginFromWindow();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizarEmail(email),
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      setMensagem(mensagemErroAutenticacao(error.message));
      setStatus("idle");
      return;
    }
    setStatus("sent");
    setMensagem("Enviamos um link para seu e-mail. Abra a caixa de entrada.");
  }

  async function entrarComGoogle() {
    setMensagem(null);
    setStatus("loading");
    const supabase = createClient();
    const origin = publicAppOriginFromWindow();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      setMensagem(mensagemErroAutenticacao(error.message));
      setStatus("idle");
      return;
    }
    // No Android o fluxo pode abrir o Chrome e voltar ao app sem redirect: evita botões presos em "loading".
    window.setTimeout(() => setStatus("idle"), 4000);
  }

  async function entrarComSenha(e: React.FormEvent) {
    e.preventDefault();
    setMensagem(null);
    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizarEmail(email),
      password: senha,
    });
    setStatus("idle");
    if (error) {
      setMensagem(mensagemErroAutenticacao(error.message));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function enviarRedefinicaoSenha() {
    const mail = normalizarEmail(email);
    if (!mail) {
      setMensagem("Informe o e-mail acima para receber o link de redefinição.");
      return;
    }
    setMensagem(null);
    setStatus("loading");
    const supabase = createClient();
    const origin = publicAppOriginFromWindow();
    const { error } = await supabase.auth.resetPasswordForEmail(mail, {
      redirectTo: `${origin}/auth/redefinir-senha`,
    });
    setStatus("idle");
    if (error) {
      setMensagem(mensagemErroAutenticacao(error.message));
      return;
    }
    setMensagem(
      "Se existir conta com este e-mail, enviamos instruções para redefinir a senha."
    );
  }

  async function criarConta() {
    setMensagem(null);
    if (senha.length < 6) {
      setMensagem("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setStatus("loading");
    const supabase = createClient();
    const origin = publicAppOriginFromWindow();
    const { error } = await supabase.auth.signUp({
      email: normalizarEmail(email),
      password: senha,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    setStatus("idle");
    if (error) {
      setMensagem(mensagemErroAutenticacao(error.message));
      return;
    }
    setMensagem(
      "Conta criada. Se o projeto exigir confirmação por e-mail, abra a mensagem enviada. Caso contrário, já pode entrar com e-mail e senha."
    );
  }

  return (
    <div className="relative w-full max-w-md space-y-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src="/lista-mercado-app-logo.svg"
          alt=""
          width={72}
          height={72}
          className="h-16 w-16 rounded-2xl shadow-[var(--shadow-card)] ring-1 ring-[var(--border-default)]"
          priority
        />
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)]">
            Lista de mercado
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Organize compras com clareza — no celular ou no desktop.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--elevated)]/95 p-6 shadow-[var(--shadow-login)] backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
          Entrar
        </div>

        <button
          type="button"
          onClick={() => void entrarComGoogle()}
          disabled={status === "loading"}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[var(--border-strong)] bg-[var(--input-fill)] py-3.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--ghost-hover)] disabled:opacity-60"
        >
          {status === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Continuar com Google
        </button>
        <p className="mt-2 text-center text-[11px] leading-snug text-[var(--muted)]">
          No Android, o login com Google costuma abrir o{" "}
          <strong className="text-[var(--ink)]">Chrome/navegador</strong> por política de
          segurança — não é falha do app. Para tudo dentro do app, use{" "}
          <strong className="text-[var(--ink)]">e-mail e senha</strong> abaixo.
        </p>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--border-default)]" />
          <span className="text-xs text-[var(--muted)]">e-mail e senha</span>
          <span className="h-px flex-1 bg-[var(--border-default)]" />
        </div>

        <form onSubmit={entrarComSenha} className="mb-4 space-y-3">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
              <Mail className="h-3.5 w-3.5" />
              E-mail
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="w-full rounded-2xl border border-[var(--border-default)] bg-[var(--input-fill)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
              <KeyRound className="h-3.5 w-3.5" />
              Senha
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="w-full rounded-2xl border border-[var(--border-default)] bg-[var(--input-fill)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)]"
            />
            <span className="mt-1 block text-[11px] text-[var(--muted)]">
              Mínimo 6 caracteres (também para criar conta).
            </span>
          </label>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void enviarRedefinicaoSenha()}
              disabled={status === "loading"}
              className="text-xs font-medium text-[var(--accent)] hover:underline disabled:opacity-50"
            >
              Esqueci a senha
            </button>
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--on-accent)] transition hover:opacity-95 disabled:opacity-60"
          >
            {status === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
            Entrar
          </button>
        </form>

        <button
          type="button"
          onClick={() => void criarConta()}
          disabled={status === "loading" || !email.trim()}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-default)] bg-[var(--elevated)] py-3 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--ghost-hover)] disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          Criar conta
        </button>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--border-default)]" />
          <span className="text-xs text-[var(--muted)]">ou link no e-mail</span>
          <span className="h-px flex-1 bg-[var(--border-default)]" />
        </div>

        <form onSubmit={enviarLink} className="space-y-4">
          <p className="text-xs text-[var(--muted)]">
            Sem senha: enviamos um link de acesso para o seu e-mail.
          </p>
          <button
            type="submit"
            disabled={status === "loading" || status === "sent" || !email.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-strong)] bg-[var(--input-fill)] py-3.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--ghost-hover)] disabled:opacity-60"
          >
            {status === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : status === "sent" ? (
              "Link enviado"
            ) : (
              "Receber link"
            )}
          </button>
        </form>

        {mensagem ? (
          <p
            className={`mt-4 text-center text-sm ${
              status === "sent" || mensagem.startsWith("Conta criada")
                ? "text-emerald-700"
                : "text-amber-800"
            }`}
          >
            {mensagem}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col items-center gap-2 pb-4 text-center">
        <p className="text-[11px] text-[var(--muted)]">Desenvolvido por</p>
        <Link
          href={LIZ_SITE}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl px-2 py-1 transition hover:opacity-90"
          aria-label="Liz Software — abrir site"
        >
          <Image
            src="/liz-software-icon.svg"
            alt="Liz Software"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg shadow-sm"
          />
          <span className="text-xs font-semibold text-[var(--ink)]">
            Liz Software
          </span>
        </Link>
      </div>
    </div>
  );
}
