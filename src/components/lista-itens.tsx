"use client";

import {
  adicionarItem,
  alternarItemConcluido,
  atualizarListaItem,
  excluirItem,
} from "@/app/actions/listas";
import { UNIDADES_MEDIDA } from "@/lib/unidades";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type ItemLinha = {
  ListaItem_codigo: string;
  ListaItem_nome: string;
  ListaItem_quantidade: number;
  ListaItem_unidade: string;
  ListaItem_concluido: boolean;
};

type Props = {
  listaCodigo: string;
  itensIniciais: ItemLinha[];
};

const selectUnClass =
  "w-full rounded-xl border border-[var(--border-default)] bg-[var(--elevated)] px-2 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)] sm:w-28";

export function ListaItens({ listaCodigo, itensIniciais }: Props) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [adicionando, setAdicionando] = useState(false);
  /** Operação em curso na lista — evita cliques duplos e mostra spinner no botão certo. */
  const [acaoLista, setAcaoLista] = useState<{
    id: string;
    tipo: "toggle" | "remove";
  } | null>(null);
  const [erroAdicionar, setErroAdicionar] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [draftNome, setDraftNome] = useState("");
  const [draftQtd, setDraftQtd] = useState("");
  const [draftUn, setDraftUn] = useState("");
  const [erroEdicaoItem, setErroEdicaoItem] = useState<string | null>(null);

  async function onToggle(id: string, atual: boolean) {
    if (acaoLista !== null || adicionando || pendente) return;
    setAcaoLista({ id, tipo: "toggle" });
    try {
      await alternarItemConcluido(listaCodigo, id, !atual);
      router.refresh();
    } finally {
      setAcaoLista(null);
    }
  }

  async function onRemove(id: string) {
    if (acaoLista !== null || adicionando || pendente) return;
    setAcaoLista({ id, tipo: "remove" });
    try {
      await excluirItem(listaCodigo, id);
      router.refresh();
    } finally {
      setAcaoLista(null);
    }
  }

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("listaCodigo", listaCodigo);
    setErroAdicionar(null);
    setAdicionando(true);
    try {
      const r = await adicionarItem(fd);
      if (r && "erro" in r && r.erro) {
        setErroAdicionar(r.erro);
        return;
      }
      form.reset();
      const un = form.elements.namedItem("unidade") as HTMLSelectElement | null;
      if (un) un.value = "un";
      router.refresh();
    } finally {
      setAdicionando(false);
    }
  }

  const ordenados = [...itensIniciais].sort(
    (a, b) => Number(a.ListaItem_concluido) - Number(b.ListaItem_concluido)
  );

  function abrirEdicao(item: ItemLinha) {
    setErroEdicaoItem(null);
    setEditandoId(item.ListaItem_codigo);
    setDraftNome(item.ListaItem_nome);
    setDraftQtd(String(item.ListaItem_quantidade));
    setDraftUn(
      UNIDADES_MEDIDA.some((u) => u.value === item.ListaItem_unidade)
        ? item.ListaItem_unidade
        : "un"
    );
  }

  function fecharEdicao() {
    setErroEdicaoItem(null);
    setEditandoId(null);
  }

  function salvarEdicao(itemCodigo: string) {
    const n = draftNome.trim();
    if (!n) return;
    if (acaoLista !== null || adicionando) return;
    setErroEdicaoItem(null);
    startTransition(async () => {
      const r = await atualizarListaItem(
        listaCodigo,
        itemCodigo,
        n,
        draftQtd,
        draftUn
      );
      if (r.erro) {
        setErroEdicaoItem(r.erro);
        return;
      }
      fecharEdicao();
      router.refresh();
    });
  }

  const listaOcupada = adicionando || pendente || acaoLista !== null;

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => void onAdd(e)}
        aria-busy={adicionando}
        className="flex flex-col gap-2 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--input-fill)]/80 p-4 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <input type="hidden" name="listaCodigo" value={listaCodigo} />
        <div className="min-w-0 flex-1 sm:min-w-[200px]">
          <label className="mb-1 block text-xs text-[var(--muted)]">Item</label>
          <input
            name="nome"
            required
            disabled={adicionando}
            placeholder="Ex.: Leite integral"
            className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--elevated)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:w-auto sm:grid-cols-none sm:flex sm:items-end">
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Qtd</label>
            <input
              name="quantidade"
              type="text"
              inputMode="decimal"
              defaultValue="1"
              disabled={adicionando}
              className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--elevated)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Unid.</label>
            <select
              name="unidade"
              defaultValue="un"
              disabled={adicionando}
              className={`${selectUnClass} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {UNIDADES_MEDIDA.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={adicionando || pendente}
          className="inline-flex min-w-[9.5rem] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] hover:opacity-95 disabled:opacity-60 sm:shrink-0"
        >
          {adicionando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {adicionando ? "A adicionar…" : "Adicionar"}
        </button>
        {adicionando ? (
          <p
            className="basis-full text-xs text-[var(--muted)] sm:order-last"
            role="status"
            aria-live="polite"
          >
            A adicionar o produto — aguarde um instante para não duplicar o item.
          </p>
        ) : null}
        {erroAdicionar ? (
          <p className="basis-full text-xs text-amber-800 sm:order-last">{erroAdicionar}</p>
        ) : null}
      </form>

      <ul className="space-y-2">
        {ordenados.length === 0 ? (
          <li className="rounded-2xl border border-[var(--border-default)] bg-[var(--elevated)] px-4 py-10 text-center text-sm text-[var(--muted)] shadow-sm">
            Nenhum item ainda. Adicione o primeiro acima.
          </li>
        ) : null}
        {ordenados.map((item) =>
          editandoId === item.ListaItem_codigo ? (
            <li
              key={item.ListaItem_codigo}
              className="rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent-subtle)] p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="min-w-0 flex-1 sm:min-w-[200px]">
                  <label className="mb-1 block text-xs text-[var(--muted)]">Item</label>
                  <input
                    value={draftNome}
                    onChange={(e) => setDraftNome(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--elevated)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
                  <div>
                    <label className="mb-1 block text-xs text-[var(--muted)]">Qtd</label>
                    <input
                      value={draftQtd}
                      onChange={(e) => setDraftQtd(e.target.value)}
                      inputMode="decimal"
                      className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--elevated)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)] sm:w-20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--muted)]">Unid.</label>
                    <select
                      value={draftUn}
                      onChange={(e) => setDraftUn(e.target.value)}
                      className={selectUnClass}
                    >
                      {UNIDADES_MEDIDA.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => void salvarEdicao(item.ListaItem_codigo)}
                    disabled={pendente || !draftNome.trim()}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] hover:opacity-95 disabled:opacity-60 sm:flex-initial"
                  >
                    {pendente ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={fecharEdicao}
                    disabled={pendente}
                    className="inline-flex items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--elevated)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--ghost-hover)] hover:text-[var(--ink)] disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {erroEdicaoItem ? (
                <p className="mt-2 text-xs text-amber-800">{erroEdicaoItem}</p>
              ) : null}
            </li>
          ) : (
            <li
              key={item.ListaItem_codigo}
              className="group flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--elevated)] px-3 py-3 shadow-sm transition hover:border-[var(--border-strong)]"
            >
              <button
                type="button"
                aria-pressed={item.ListaItem_concluido}
                aria-busy={
                  acaoLista?.id === item.ListaItem_codigo &&
                  acaoLista.tipo === "toggle"
                }
                disabled={listaOcupada}
                onClick={() => void onToggle(item.ListaItem_codigo, item.ListaItem_concluido)}
                title={
                  listaOcupada && acaoLista?.id !== item.ListaItem_codigo
                    ? "Aguarde a operação em curso"
                    : undefined
                }
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  item.ListaItem_concluido
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-[var(--border-default)] bg-[var(--input-fill)] text-[var(--muted)] hover:border-[var(--accent)]/50"
                }`}
              >
                {acaoLista?.id === item.ListaItem_codigo &&
                acaoLista.tipo === "toggle" ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${
                    item.ListaItem_concluido
                      ? "text-[var(--muted)] line-through decoration-[var(--line-faint)]"
                      : "text-[var(--ink)]"
                  }`}
                >
                  {item.ListaItem_nome}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {item.ListaItem_quantidade} {item.ListaItem_unidade}
                </p>
              </div>
              <button
                type="button"
                onClick={() => abrirEdicao(item)}
                disabled={listaOcupada}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--muted)] opacity-70 transition hover:bg-[var(--ghost-hover)] hover:text-[var(--accent)] hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Editar item"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void onRemove(item.ListaItem_codigo)}
                disabled={listaOcupada}
                aria-busy={
                  acaoLista?.id === item.ListaItem_codigo &&
                  acaoLista.tipo === "remove"
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--muted)] opacity-70 transition hover:bg-[var(--danger-hover)] hover:text-red-600 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Remover item"
              >
                {acaoLista?.id === item.ListaItem_codigo &&
                acaoLista.tipo === "remove" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
