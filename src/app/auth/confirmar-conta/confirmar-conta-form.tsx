"use client";

import { createClient } from "@/lib/supabase/client";
import { mensagemErroAutenticacao } from "@/lib/auth-mensagens";
import { Loader2, Sparkles, UserCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const MSG_SEM_LINK =
  "Abra o link «Confirmar o seu e-mail» na mensagem que enviámos ao criar a conta. Se o link expirou, crie de novo a conta ou use «Receber link» no login.";

export function ConfirmarContaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [fase, setFase] = useState<"invalido" | "checando" | "erro">(() =>
    code ? "checando" : "invalido"
  );
  const [erro, setErro] = useState<string | null>(() =>
    code ? null : MSG_SEM_LINK
  );

  useEffect(() => {
    if (!code) {
      setFase("invalido");
      setErro(MSG_SEM_LINK);
      return;
    }

    let cancel = false;
    (async () => {
      const supabase = createClient();
      const { error: exchangeErr } =
        await supabase.auth.exchangeCodeForSession(code);
      if (cancel) return;
      if (exchangeErr) {
        setErro(mensagemErroAutenticacao(exchangeErr.message));
        setFase("erro");
        return;
      }
      window.history.replaceState(null, "", "/auth/confirmar-conta");
      router.replace("/");
      router.refresh();
    })();

    return () => {
      cancel = true;
    };
  }, [code, router]);

  if (fase === "invalido" || fase === "erro") {
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
              {fase === "invalido"
                ? "Link de confirmação em falta ou inválido."
                : "Não foi possível confirmar o registo."}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--elevated)]/95 p-6 shadow-[var(--shadow-login)] backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
            <UserCheck className="h-3.5 w-3.5 text-[var(--accent)]" />
            Confirmação
          </div>
          <p className="text-center text-sm text-amber-800">{erro}</p>
          <p className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-semibold text-[var(--accent)] hover:underline"
            >
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
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
            Confirme o seu registo para começar a usar a app.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--elevated)]/95 p-6 shadow-[var(--shadow-login)] backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
          Confirmar o seu e-mail
        </div>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <Loader2
            className="h-10 w-10 animate-spin text-[var(--accent)]"
            aria-hidden
          />
          <p className="text-sm text-[var(--muted)]" role="status" aria-live="polite">
            A validar o link enviado por e-mail…
          </p>
        </div>
      </div>
    </div>
  );
}
