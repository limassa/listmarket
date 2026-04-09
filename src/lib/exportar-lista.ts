export type ItemExport = {
  nome: string;
  quantidade: number;
  unidade: string;
  concluido: boolean;
};

function formatarData(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function montarTextoPlano(
  tituloLista: string,
  atualizadaEm: string,
  itens: ItemExport[]
): string {
  const linhas = [
    `Lista de mercado: ${tituloLista}`,
    `Atualizada em: ${formatarData(atualizadaEm)}`,
    "",
    "Itens (funciona offline — abra este ficheiro no telemóvel):",
    "",
  ];
  if (itens.length === 0) {
    linhas.push("(lista vazia)");
  } else {
    for (const i of itens) {
      const marca = i.concluido ? "[x]" : "[ ]";
      const q = `${i.quantidade} ${i.unidade}`.trim();
      linhas.push(`${marca} ${q} — ${i.nome}`);
    }
  }
  linhas.push("", "---", "Gerado pelo app Lista de mercado.");
  return linhas.join("\n");
}

export function montarHtmlOffline(
  tituloLista: string,
  atualizadaEm: string,
  itens: ItemExport[]
): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const itensHtml =
    itens.length === 0
      ? "<p class=\"vazio\">(lista vazia)</p>"
      : `<ul class="itens">${itens
          .map(
            (i) =>
              `<li class="${i.concluido ? "ok" : ""}"><span class="marcador">${
                i.concluido ? "✓" : "○"
              }</span><span class="qtd">${esc(
                String(i.quantidade)
              )} ${esc(i.unidade)}</span><span class="nome">${esc(
                i.nome
              )}</span></li>`
          )
          .join("")}</ul>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(tituloLista)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 1.25rem; background: #f8fafc; color: #0f172a; line-height: 1.45; max-width: 32rem; margin-inline: auto; }
  h1 { font-size: 1.35rem; margin: 0 0 0.35rem; letter-spacing: -0.02em; }
  .meta { font-size: 0.8rem; color: #64748b; margin: 0 0 1.25rem; }
  .itens { list-style: none; padding: 0; margin: 0; }
  .itens li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.35rem 0.5rem; padding: 0.55rem 0; border-bottom: 1px solid #e2e8f0; }
  .itens li.ok { color: #64748b; text-decoration: line-through; }
  .marcador { width: 1.25rem; flex-shrink: 0; font-weight: 600; }
  .qtd { font-variant-numeric: tabular-nums; color: #475569; font-size: 0.9rem; min-width: 4rem; }
  .nome { flex: 1; min-width: 0; }
  .vazio { color: #64748b; font-size: 0.95rem; }
  footer { margin-top: 1.5rem; font-size: 0.7rem; color: #94a3b8; }
</style>
</head>
<body>
  <h1>${esc(tituloLista)}</h1>
  <p class="meta">Atualizada em ${esc(formatarData(atualizadaEm))}</p>
  ${itensHtml}
  <footer>Lista de mercado — ficheiro para ver sem internet.</footer>
</body>
</html>`;
}

export function nomeArquivoSeguro(nomeLista: string, ext: "txt" | "html") {
  const base = nomeLista
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return `${base || "lista-mercado"}.${ext}`;
}
