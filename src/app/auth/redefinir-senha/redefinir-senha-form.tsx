"use client";

import { createClient } from "@/lib/supabase/client";
import { mensagemErroAutenticacao } from "@/lib/auth-mensagens";
import { KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [fase, setFase] = useState<"checando" | "pronto" | "erro">("checando");
  const [erro, setErro] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const supabase = createClient();
      if (code) {
        const { error: exchangeErr } =
          await supabase.auth.exchangeCodeForSession(code);
        if (cancel) return;
        if (exchangeErr) {
          setErro(mensagemErroAutenticacao(exchangeErr.message));
          setFase("erro");
          return;
        }
        window.history.replaceState(null, "", "/auth/redefinir-senha");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancel) return;
      if (!session?.user) {
        setErro(
          "Link inválido ou sessão expirada. No login, use «Esqueci a senha» para receber um novo e-mail."
        );
        setFase("erro");
        return;
      }
      setFase("pronto");
    })();
    return () => {
      cancel = true;
    };
  }, [code]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMensagem(null);
    if (senha.length < 6) {
      setMensagem("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== senha2) {
      setMensagem("As senhas não coincidem.");
      return;
    }
    setEnviando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) {
      setMensagem(mensagemErroAutenticacao(error.message));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  if (fase === "checando") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
        <p className="text-sm text-[var(--muted)]">A carregar…</p>
      </div>
    );
  }

  if (fase === "erro") {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 px-4 py-16 text-center">
        <p className="text-sm text-amber-800">{erro}</p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-16">
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">
          Nova senha
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Defina uma senha nova para a sua conta.
        </p>
      </div>

      <form onSubmit={(e) => void salvar(e)} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
            <KeyRound className="h-3.5 w-3.5" />
            Nova senha
          </span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            minLength={6}
            className="w-full rounded-2xl border border-[var(--border-default)] bg-[var(--input-fill)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)]"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 text-xs font-medium text-[var(--muted)]">
            Repetir senha
          </span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={senha2}
            onChange={(e) => setSenha2(e.target.value)}
            minLength={6}
            className="w-full rounded-2xl border border-[var(--border-default)] bg-[var(--input-fill)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)]"
          />
        </label>
        <button
          type="submit"
          disabled={enviando}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--on-accent)] transition hover:opacity-95 disabled:opacity-50"
        >
          {enviando ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Guardar senha"
          )}
        </button>
      </form>

      {mensagem ? (
        <p className="text-center text-sm text-amber-800">{mensagem}</p>
      ) : null}

      <p className="text-center">
        <Link
          href="/login"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
