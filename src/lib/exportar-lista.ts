import { jsPDF } from "jspdf";

export type ItemExport = {
  nome: string;
  quantidade: number;
  unidade: string;
  concluido: boolean;
};

export function formatarDataExportacao(iso: string) {
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
    `Atualizada em: ${formatarDataExportacao(atualizadaEm)}`,
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
  <p class="meta">Atualizada em ${esc(formatarDataExportacao(atualizadaEm))}</p>
  ${itensHtml}
  <footer>Lista de mercado — ficheiro para ver sem internet.</footer>
</body>
</html>`;
}

const PDF_FOOTER_RESERVE_MM = 22;

/** Rasteriza imagem (SVG/PNG) para PNG em data URL — só no browser (PDF com logos). */
async function assetToPngDataUrl(
  publicPath: string,
  targetWidthPx: number
): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const src = new URL(publicPath, window.location.origin).href;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = targetWidthPx;
        const h = Math.max(
          1,
          Math.round((img.naturalHeight / img.naturalWidth) * targetWidthPx)
        );
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function desenharRodapeEmpresa(
  doc: InstanceType<typeof jsPDF>,
  pageW: number,
  pageH: number,
  lizPng: string | null
) {
  const footerTextY = pageH - 4;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  if (lizPng) {
    const lw = 7.5;
    const lh = 7.5;
    doc.addImage(
      lizPng,
      "PNG",
      (pageW - lw) / 2,
      footerTextY - lh - 3,
      lw,
      lh
    );
  }
  doc.text("Desenvolvido por Liz Software", pageW / 2, footerTextY, {
    align: "center",
  });
}

export async function montarPdfBlob(
  tituloLista: string,
  atualizadaEm: string,
  itens: ItemExport[]
): Promise<Blob> {
  const [appPng, lizPng] =
    typeof window !== "undefined"
      ? await Promise.all([
          assetToPngDataUrl("/lista-mercado-app-logo.svg", 280),
          assetToPngDataUrl("/liz-software-icon.svg", 160),
        ])
      : [null, null];

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentMaxY = pageH - PDF_FOOTER_RESERVE_MM;
  let y = 10;

  if (appPng) {
    const logoMm = 26;
    doc.addImage(appPng, "PNG", (pageW - logoMm) / 2, y, logoMm, logoMm);
    y += logoMm + 6;
  } else {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text("Lista Mercado", pageW / 2, y + 4, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y += 10;
  }

  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(tituloLista, pageW - 28);
  for (const line of titleLines) {
    if (y > contentMaxY - 8) {
      doc.addPage();
      y = 14;
    }
    doc.text(line, pageW / 2, y, { align: "center" });
    y += 7;
  }
  y += 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  if (y > contentMaxY - 6) {
    doc.addPage();
    y = 14;
  }
  doc.text(`Atualizada em: ${formatarDataExportacao(atualizadaEm)}`, pageW / 2, y, {
    align: "center",
  });
  y += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);

  if (itens.length === 0) {
    if (y > contentMaxY - 8) {
      doc.addPage();
      y = 14;
    }
    doc.text("(lista vazia)", marginX, y);
  } else {
    const gapAposCheckbox = 5;
    const colTexto = marginX + gapAposCheckbox + 3.2;
    const larguraTexto = pageW - colTexto - marginX;

    for (const item of itens) {
      const textoItem = `${item.quantidade} ${item.unidade} — ${item.nome}`;
      const lines = doc.splitTextToSize(textoItem, larguraTexto);
      const blockH = Math.max(6, lines.length * 5.5 + 1.5);

      if (y + blockH > contentMaxY) {
        doc.addPage();
        y = 14;
      }

      const box = 3.2;
      const boxTop = y - 3.2;
      doc.setDrawColor(55, 55, 55);
      doc.setLineWidth(0.2);
      doc.rect(marginX, boxTop, box, box);
      if (item.concluido) {
        doc.setLineWidth(0.45);
        doc.line(
          marginX + 0.65,
          boxTop + box * 0.52,
          marginX + box * 0.42,
          boxTop + box - 0.55
        );
        doc.line(
          marginX + box * 0.42,
          boxTop + box - 0.55,
          marginX + box - 0.45,
          boxTop + 0.55
        );
        doc.setLineWidth(0.2);
      }

      if (item.concluido) {
        doc.setTextColor(95, 95, 95);
      } else {
        doc.setTextColor(0, 0, 0);
      }
      doc.text(lines, colTexto, y);
      doc.setTextColor(0, 0, 0);

      y += blockH;
    }
  }

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    desenharRodapeEmpresa(doc, pageW, pageH, lizPng);
  }

  return doc.output("blob");
}

export function nomeArquivoSeguro(
  nomeLista: string,
  ext: "txt" | "html" | "pdf"
) {
  const base = nomeLista
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return `${base || "lista-mercado"}.${ext}`;
}
