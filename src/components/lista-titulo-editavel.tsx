"use client";

import { renomearLista } from "@/app/actions/listas";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Props = {
  listaCodigo: string;
  nome: string;
};

export function ListaTituloEditavel({ listaCodigo, nome }: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(nome);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  useEffect(() => {
    if (!editando) setValor(nome);
  }, [nome, editando]);

  function cancelar() {
    setErro(null);
    setValor(nome);
    setEditando(false);
  }

  function salvar() {
    const v = valor.trim();
    if (!v) {
      setErro("Informe um nome.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      const r = await renomearLista(listaCodigo, v);
      if (r.erro) {
        setErro(r.erro);
        return;
      }
      setEditando(false);
      router.refresh();
    });
  }

  if (!editando) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h1 className="font-display min-w-0 flex-1 text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
          {nome}
        </h1>
        <button
          type="button"
          onClick={() => {
            setValor(nome);
            setErro(null);
            setEditando(true);
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--elevated)] text-[var(--muted)] shadow-sm transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
          aria-label="Editar nome da lista"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              salvar();
            }
            if (e.key === "Escape") cancelar();
          }}
          autoFocus
          className="font-display min-w-0 flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--input-fill)] px-3 py-2 text-xl font-semibold tracking-tight text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)] sm:text-2xl"
          aria-label="Novo nome da lista"
        />
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => void salvar()}
            disabled={pendente}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--on-accent)] transition hover:opacity-95 disabled:opacity-60"
            aria-label="Salvar nome"
          >
            {pendente ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
          <button
            type="button"
            onClick={cancelar}
            disabled={pendente}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--elevated)] text-[var(--muted)] transition hover:bg-[var(--ghost-hover)] hover:text-[var(--ink)] disabled:opacity-60"
            aria-label="Cancelar edição"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {erro ? <p className="text-xs text-amber-800">{erro}</p> : null}
    </div>
  );
}
