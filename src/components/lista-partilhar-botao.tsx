"use client";

import { createClient } from "@/lib/supabase/client";
import {
  montarPdfBlob,
  nomeArquivoSeguro,
  type ItemExport,
} from "@/lib/exportar-lista";
import { Loader2, Share2 } from "lucide-react";
import { useState } from "react";

async function buscarItensExport(listaCodigo: string): Promise<ItemExport[]> {
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
    concluido: Boolean(r.ListaItem_concluido),
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

type Props = {
  listaCodigo: string;
  listaNome: string;
  listaAtualizadaEm: string;
  /** "toolbar" = botão com borda; "ghost" = só ícone discreto na listagem */
  variant?: "toolbar" | "ghost";
};

export function ListaPartilharBotao({
  listaCodigo,
  listaNome,
  listaAtualizadaEm,
  variant = "toolbar",
}: Props) {
  const [carregando, setCarregando] = useState(false);

  async function partilharPdf() {
    setCarregando(true);
    try {
      const itens = await buscarItensExport(listaCodigo);
      const blob = await montarPdfBlob(listaNome, listaAtualizadaEm, itens);
      const nomePdf = nomeArquivoSeguro(listaNome, "pdf");
      const file = new File([blob], nomePdf, { type: "application/pdf" });

      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: listaNome,
            text: `Lista: ${listaNome}`,
            files: [file],
          });
          return;
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }

      downloadBlob(blob, nomePdf);
    } finally {
      setCarregando(false);
    }
  }

  const baseBtn =
    variant === "ghost"
      ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--muted)] transition hover:bg-[var(--ghost-hover)] hover:text-[var(--accent)] disabled:opacity-40"
      : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--elevated)] text-[var(--accent)] shadow-sm transition hover:bg-[var(--ghost-hover)] disabled:opacity-50";

  return (
    <button
      type="button"
      onClick={() => void partilharPdf()}
      disabled={carregando}
      className={baseBtn}
      title="Partilhar lista em PDF"
      aria-label="Partilhar lista em PDF"
    >
      {carregando ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Share2 className="h-5 w-5" strokeWidth={2} />
      )}
    </button>
  );
}
