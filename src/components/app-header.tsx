import { sair } from "@/app/actions/listas";
import { LogOut } from "lucide-react";
import Image from "next/image";

type Props = {
  nome: string | null;
  email: string;
  fotoUrl: string | null;
};

export function AppHeader({ nome, email, fotoUrl }: Props) {
  const inicial = (nome ?? email).charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border-default)] bg-[var(--surface)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {fotoUrl ? (
            <Image
              src={fotoUrl}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[var(--border-default)]"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-sm font-semibold text-[var(--accent)] ring-2 ring-[var(--accent)]/20">
              {inicial}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--ink)]">
              {nome ?? "Bem-vindo(a)"}
            </p>
            <p className="truncate text-xs text-[var(--muted)]">{email}</p>
          </div>
        </div>
        <form action={sair}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--elevated)] px-3 py-2 text-xs font-medium text-[var(--muted)] shadow-sm transition hover:border-[var(--border-strong)] hover:text-[var(--ink)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
