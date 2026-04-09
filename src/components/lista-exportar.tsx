"use client";

import { createClient } from "@/lib/supabase/client";
import {
  montarHtmlOffline,
  montarTextoPlano,
  nomeArquivoSeguro,
  type ItemExport,
} from "@/lib/exportar-lista";
import { Download, Loader2, Share2 } from "lucide-react";
import { useState } from "react";

type Props = {
  listaCodigo: string;
  listaNome: string;
  listaAtualizadaEm: string;
};

async function buscarItens(listaCodigo: string): Promise<ItemExport[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ListaItem")
    .select(
      "ListaItem_nome, ListaItem_quantidade, ListaItem_unidade, ListaItem_concluido, ListaItem_ordem"
    )
    .eq("ListaItem_listaCodigo", listaCodigo)
    .order("ListaItem_ordem", { ascending: true });

  if (error || !data) return [];

  return data.map((r) => ({
    nome: r.ListaItem_nome,
    quantidade: Number(r.ListaItem_quantidade) || 1,
    unidade: r.ListaItem_unidade || "un",
    concluido: r.ListaItem_concluido,
  }));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ListaExportar({
  listaCodigo,
  listaNome,
  listaAtualizadaEm,
}: Props) {
  const [carregando, setCarregando] = useState(false);

  async function obterItens(): Promise<ItemExport[] | null> {
    setCarregando(true);
    try {
      return await buscarItens(listaCodigo);
    } finally {
      setCarregando(false);
    }
  }

  async function baixarTxt() {
    const itens = await obterItens();
    if (itens === null) return;
    const texto = montarTextoPlano(listaNome, listaAtualizadaEm, itens);
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, nomeArquivoSeguro(listaNome, "txt"));
  }

  async function baixarHtml() {
    const itens = await obterItens();
    if (itens === null) return;
    const html = montarHtmlOffline(listaNome, listaAtualizadaEm, itens);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    downloadBlob(blob, nomeArquivoSeguro(listaNome, "html"));
  }

  async function compartilhar() {
    const itens = await obterItens();
    if (itens === null) return;
    const texto = montarTextoPlano(listaNome, listaAtualizadaEm, itens);
    const nomeTxt = nomeArquivoSeguro(listaNome, "txt");
    const file = new File([texto], nomeTxt, { type: "text/plain;charset=utf-8" });

    const shareData: ShareData = {
      title: listaNome,
      text: `Lista: ${listaNome}\n\n${texto.slice(0, 1800)}${texto.length > 1800 ? "…" : ""}`,
    };

    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ ...shareData, files: [file] });
        return;
      }
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }

    downloadBlob(
      new Blob([texto], { type: "text/plain;charset=utf-8" }),
      nomeTxt
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-[var(--border-default)] bg-[var(--elevated)] p-4 shadow-sm">
      <p className="mb-3 text-xs font-medium text-[var(--muted)]">
        Partilhar ou guardar para ver{" "}
        <strong className="text-[var(--ink)]">sem internet</strong> (WhatsApp,
        ficheiros, etc.)
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void compartilhar()}
          disabled={carregando}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--on-accent)] min-[400px]:flex-initial hover:opacity-95 disabled:opacity-60"
        >
          {carregando ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4 shrink-0" strokeWidth={2} />
          )}
          Partilhar
        </button>
        <button
          type="button"
          onClick={() => void baixarTxt()}
          disabled={carregando}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--input-fill)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--ghost-hover)] disabled:opacity-60"
        >
          <Download className="h-4 w-4 shrink-0" />
          .txt
        </button>
        <button
          type="button"
          onClick={() => void baixarHtml()}
          disabled={carregando}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--input-fill)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--ghost-hover)] disabled:opacity-60"
        >
          <Download className="h-4 w-4 shrink-0" />
          .html
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-[var(--muted)]">
        O ficheiro .txt ou .html abre no telemóvel sem dados móveis depois de
        recebido ou descarregado.
      </p>
    </div>
  );
}
