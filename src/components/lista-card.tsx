"use client";

import { excluirLista, renomearLista } from "@/app/actions/listas";
import { ListaPartilharBotao } from "@/components/lista-partilhar-botao";
import { Check, ClipboardList, Loader2, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Props = {
  codigo: string;
  nome: string;
  atualizadaEm: string;
  totalItens: number;
};

function formatarData(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function ListaCard({ codigo, nome, atualizadaEm, totalItens }: Props) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const [nomeEdit, setNomeEdit] = useState(nome);
  const [erroEdit, setErroEdit] = useState<string | null>(null);

  useEffect(() => {
    if (!editando) setNomeEdit(nome);
  }, [nome, editando]);

  function onExcluir() {
    if (!confirm(`Excluir a lista "${nome}"?`)) return;
    startTransition(async () => {
      await excluirLista(codigo);
      router.refresh();
    });
  }

  function salvarNome() {
    const v = nomeEdit.trim();
    if (!v) return;
    setErroEdit(null);
    startTransition(async () => {
      const r = await renomearLista(codigo, v);
      if (r.erro) {
        setErroEdit(r.erro);
        return;
      }
      setEditando(false);
      router.refresh();
    });
  }

  function cancelarEdicao() {
    setNomeEdit(nome);
    setErroEdit(null);
    setEditando(false);
  }

  return (
    <div className="group relative flex items-stretch gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--elevated)] p-4 shadow-[var(--shadow-card)] transition hover:border-[var(--accent)]/35 hover:shadow-md">
      {!editando ? (
        <>
          <Link
            href={`/lista/${codigo}`}
            className="flex min-w-0 flex-1 items-start gap-3"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] ring-1 ring-[var(--accent)]/20">
              <ClipboardList className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-[var(--ink)]">{nome}</span>
              <span className="mt-0.5 block text-xs text-[var(--muted)]">
                {totalItens === 0
                  ? "Vazia"
                  : `${totalItens} item${totalItens === 1 ? "" : "s"}`}
                {" · "}
                {formatarData(atualizadaEm)}
              </span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1 self-center">
            <ListaPartilharBotao
              listaCodigo={codigo}
              listaNome={nome}
              listaAtualizadaEm={atualizadaEm}
              variant="ghost"
            />
            <button
              type="button"
              onClick={() => {
                setNomeEdit(nome);
                setErroEdit(null);
                setEditando(true);
              }}
              disabled={pendente}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--muted)] opacity-80 transition hover:bg-[var(--ghost-hover)] hover:text-[var(--accent)] hover:opacity-100 disabled:opacity-40"
              aria-label="Editar nome da lista"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onExcluir}
              disabled={pendente}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--muted)] opacity-80 transition hover:bg-[var(--danger-hover)] hover:text-red-600 hover:opacity-100 disabled:opacity-40"
              aria-label="Excluir lista"
            >
              {pendente ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center self-start rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] ring-1 ring-[var(--accent)]/20 sm:self-center">
            <ClipboardList className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              value={nomeEdit}
              onChange={(e) => setNomeEdit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  salvarNome();
                }
                if (e.key === "Escape") cancelarEdicao();
              }}
              autoFocus
              className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--input-fill)] px-3 py-2 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)]"
              aria-label="Nome da lista"
            />
            <p className="text-xs text-[var(--muted)]">
              {totalItens === 0
                ? "Vazia"
                : `${totalItens} item${totalItens === 1 ? "" : "s"}`}
              {" · "}
              {formatarData(atualizadaEm)}
            </p>
            {erroEdit ? (
              <p className="text-xs text-amber-800">{erroEdit}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-1 self-center">
            <button
              type="button"
              onClick={() => void salvarNome()}
              disabled={pendente || !nomeEdit.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--on-accent)] transition hover:opacity-95 disabled:opacity-40"
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
              onClick={cancelarEdicao}
              disabled={pendente}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--elevated)] text-[var(--muted)] transition hover:bg-[var(--ghost-hover)] hover:text-[var(--ink)] disabled:opacity-40"
              aria-label="Cancelar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
