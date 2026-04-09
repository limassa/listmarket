"use client";

import { criarLista } from "@/app/actions/listas";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NovaListaForm() {
  const router = useRouter();
  const [pendente, setPendente] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setInfo(null);
    setPendente(true);
    const fd = new FormData(e.currentTarget);
    const r = await criarLista(fd);
    setPendente(false);
    if ("erro" in r && r.erro) {
      setErro(r.erro);
      return;
    }
    if ("ok" in r && r.ok) {
      if (r.itensSugeridos > 0) {
        setInfo(
          `Lista criada com ${r.itensSugeridos} item(ns) que você mais usa nas listas recentes.`
        );
      } else {
        setInfo("Lista criada. Quando tiver histórico, sugerimos itens automaticamente.");
      }
    }
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--elevated)] p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1">
        <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
          Nova lista
        </label>
        <input
          name="nome"
          required
          placeholder="Ex.: Compras da semana"
          className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--input-fill)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--placeholder)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)]"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--on-accent)] transition hover:opacity-95 disabled:opacity-60"
      >
        {pendente ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" strokeWidth={2.25} />
        )}
        Criar
      </button>
      {erro ? (
        <p className="basis-full text-xs text-amber-800 sm:order-last">{erro}</p>
      ) : null}
      {info ? (
        <p className="basis-full text-xs text-emerald-700 sm:order-last">{info}</p>
      ) : null}
    </form>
  );
}
