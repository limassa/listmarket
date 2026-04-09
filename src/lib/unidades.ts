/** Unidades para seleção nos itens da lista. */
export const UNIDADES_MEDIDA = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "un", label: "un" },
  { value: "pct", label: "pct" },
  { value: "l", label: "l" },
  { value: "ml", label: "ml" },
] as const;

export type UnidadeMedida = (typeof UNIDADES_MEDIDA)[number]["value"];

export function normalizarUnidade(u: string): string {
  const t = u.trim().toLowerCase();
  const ok = UNIDADES_MEDIDA.some((x) => x.value === t);
  return ok ? t : "un";
}
