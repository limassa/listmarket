"use server";

import {
  LISTAS_RECENTES_PARA_SUGESTAO,
  MAX_ITENS_SUGERIDOS_NA_NOVA_LISTA,
} from "@/lib/lista-sugestoes";
import { normalizarUnidade } from "@/lib/unidades";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function contextoUsuario() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entre novamente.");

  const { data: perfil, error } = await supabase
    .from("Usuario")
    .select("Usuario_codigo")
    .eq("Usuario_idAutenticacao", user.id)
    .single();

  if (error || !perfil) {
    throw new Error(
      "Perfil ainda não criado. Aguarde um instante e atualize a página (trigger no Supabase)."
    );
  }

  return { supabase, usuarioCodigo: perfil.Usuario_codigo as string };
}

async function marcarListaAtualizada(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listaCodigo: string
) {
  await supabase
    .from("Lista")
    .update({ Lista_atualizadaEm: new Date().toISOString() })
    .eq("Lista_codigo", listaCodigo);
}

/** Agrupa "Leite" e "leite " como o mesmo item para contagem de frequência. */
function normalizarNomeChave(nome: string) {
  return nome
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ");
}

/** Copia os itens mais frequentes das listas recentes; retorna quantos foram inseridos. */
async function semearItensMaisUsados(
  supabase: Awaited<ReturnType<typeof createClient>>,
  usuarioCodigo: string,
  novaListaCodigo: string
): Promise<number> {
  const { data: listasAntigas } = await supabase
    .from("Lista")
    .select("Lista_codigo, Lista_atualizadaEm")
    .eq("Lista_usuarioCodigo", usuarioCodigo)
    .neq("Lista_codigo", novaListaCodigo)
    .order("Lista_atualizadaEm", { ascending: false })
    .limit(LISTAS_RECENTES_PARA_SUGESTAO);

  const ids = (listasAntigas ?? []).map((l) => l.Lista_codigo);
  if (ids.length === 0) return 0;

  const rankPorLista = new Map<string, number>();
  (listasAntigas ?? []).forEach((l, i) => rankPorLista.set(l.Lista_codigo, i));

  const { data: itens, error: errItens } = await supabase
    .from("ListaItem")
    .select(
      "ListaItem_listaCodigo, ListaItem_nome, ListaItem_quantidade, ListaItem_unidade, ListaItem_ordem"
    )
    .in("ListaItem_listaCodigo", ids);

  if (errItens || !itens?.length) return 0;

  const ordenados = [...itens].sort((a, b) => {
    const ra = rankPorLista.get(a.ListaItem_listaCodigo) ?? 999;
    const rb = rankPorLista.get(b.ListaItem_listaCodigo) ?? 999;
    if (ra !== rb) return ra - rb;
    return (a.ListaItem_ordem ?? 0) - (b.ListaItem_ordem ?? 0);
  });

  const agregado = new Map<
    string,
    { ocorrencias: number; nome: string; quantidade: number; unidade: string }
  >();

  for (const r of ordenados) {
    const nome = String(r.ListaItem_nome ?? "").trim();
    if (!nome) continue;
    const chave = normalizarNomeChave(nome);
    const q = Number(r.ListaItem_quantidade);
    const quantidade = Number.isFinite(q) && q > 0 ? q : 1;
    const unidade =
      String(r.ListaItem_unidade ?? "un").trim() || "un";
    const atual = agregado.get(chave);
    if (atual) {
      atual.ocorrencias += 1;
    } else {
      agregado.set(chave, {
        ocorrencias: 1,
        nome,
        quantidade,
        unidade,
      });
    }
  }

  const ranking = [...agregado.values()].sort(
    (a, b) => b.ocorrencias - a.ocorrencias
  );
  const topo = ranking.slice(0, MAX_ITENS_SUGERIDOS_NA_NOVA_LISTA);

  if (topo.length === 0) return 0;

  const linhas = topo.map((v, i) => ({
    ListaItem_listaCodigo: novaListaCodigo,
    ListaItem_nome: v.nome,
    ListaItem_quantidade: v.quantidade,
    ListaItem_unidade: v.unidade,
    ListaItem_concluido: false,
    ListaItem_ordem: i + 1,
  }));

  const { error: errInsert } = await supabase.from("ListaItem").insert(linhas);
  if (errInsert) {
    console.error("semearItensMaisUsados:", errInsert.message);
    return 0;
  }

  await marcarListaAtualizada(supabase, novaListaCodigo);
  return linhas.length;
}

export async function criarLista(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { erro: "Informe um nome para a lista." };

  const { supabase, usuarioCodigo } = await contextoUsuario();

  const { data: criada, error } = await supabase
    .from("Lista")
    .insert({
      Lista_nome: nome,
      Lista_usuarioCodigo: usuarioCodigo,
    })
    .select("Lista_codigo")
    .single();

  if (error || !criada) return { erro: error?.message ?? "Não foi possível criar a lista." };

  const itensSugeridos = await semearItensMaisUsados(
    supabase,
    usuarioCodigo,
    criada.Lista_codigo
  );

  revalidatePath("/");
  revalidatePath(`/lista/${criada.Lista_codigo}`);
  return {
    ok: true,
    listaCodigo: criada.Lista_codigo,
    itensSugeridos,
  };
}

export async function excluirLista(listaCodigo: string) {
  const { supabase } = await contextoUsuario();
  const { error } = await supabase
    .from("Lista")
    .delete()
    .eq("Lista_codigo", listaCodigo);

  if (error) return { erro: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function renomearLista(listaCodigo: string, nome: string) {
  const n = nome.trim();
  if (!n) return { erro: "Informe um nome para a lista." };

  const { supabase } = await contextoUsuario();
  const agora = new Date().toISOString();
  const { error } = await supabase
    .from("Lista")
    .update({ Lista_nome: n, Lista_atualizadaEm: agora })
    .eq("Lista_codigo", listaCodigo);

  if (error) return { erro: error.message };
  revalidatePath("/");
  revalidatePath(`/lista/${listaCodigo}`);
  return { ok: true };
}

export async function adicionarItem(formData: FormData) {
  const listaCodigo = String(formData.get("listaCodigo") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const q = String(formData.get("quantidade") ?? "1").replace(",", ".");
  const quantidade = Number.parseFloat(q) || 1;
  const unidade = normalizarUnidade(String(formData.get("unidade") ?? "un"));

  if (!listaCodigo || !nome) return { erro: "Dados incompletos." };

  const { supabase } = await contextoUsuario();

  const { data: ultimo } = await supabase
    .from("ListaItem")
    .select("ListaItem_ordem")
    .eq("ListaItem_listaCodigo", listaCodigo)
    .order("ListaItem_ordem", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ordem = (ultimo?.ListaItem_ordem ?? 0) + 1;

  const { error } = await supabase.from("ListaItem").insert({
    ListaItem_listaCodigo: listaCodigo,
    ListaItem_nome: nome,
    ListaItem_quantidade: quantidade,
    ListaItem_unidade: unidade,
    ListaItem_ordem: ordem,
  });

  if (error) return { erro: error.message };
  await marcarListaAtualizada(supabase, listaCodigo);
  revalidatePath("/");
  revalidatePath(`/lista/${listaCodigo}`);
  return { ok: true };
}

export async function alternarItemConcluido(
  listaCodigo: string,
  itemCodigo: string,
  concluido: boolean
) {
  const { supabase } = await contextoUsuario();
  const { error } = await supabase
    .from("ListaItem")
    .update({ ListaItem_concluido: concluido })
    .eq("ListaItem_codigo", itemCodigo)
    .eq("ListaItem_listaCodigo", listaCodigo);

  if (error) return { erro: error.message };
  await marcarListaAtualizada(supabase, listaCodigo);
  revalidatePath(`/lista/${listaCodigo}`);
  return { ok: true };
}

export async function excluirItem(listaCodigo: string, itemCodigo: string) {
  const { supabase } = await contextoUsuario();
  const { error } = await supabase
    .from("ListaItem")
    .delete()
    .eq("ListaItem_codigo", itemCodigo);

  if (error) return { erro: error.message };
  await marcarListaAtualizada(supabase, listaCodigo);
  revalidatePath(`/lista/${listaCodigo}`);
  return { ok: true };
}

export async function atualizarListaItem(
  listaCodigo: string,
  itemCodigo: string,
  nome: string,
  quantidadeStr: string,
  unidade: string
) {
  const n = nome.trim();
  const q = quantidadeStr.replace(",", ".");
  const quantidade = Number.parseFloat(q) || 1;
  const u = normalizarUnidade(unidade);

  if (!n) return { erro: "Informe o nome do item." };

  const { supabase } = await contextoUsuario();
  const { error } = await supabase
    .from("ListaItem")
    .update({
      ListaItem_nome: n,
      ListaItem_quantidade: quantidade,
      ListaItem_unidade: u,
    })
    .eq("ListaItem_codigo", itemCodigo);

  if (error) return { erro: error.message };
  await marcarListaAtualizada(supabase, listaCodigo);
  revalidatePath("/");
  revalidatePath(`/lista/${listaCodigo}`);
  return { ok: true };
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
