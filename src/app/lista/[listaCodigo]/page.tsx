import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { ListaExportar } from "@/components/lista-exportar";
import { ListaItens, type ItemLinha } from "@/components/lista-itens";
import { ListaTituloEditavel } from "@/components/lista-titulo-editavel";
import { ArrowLeft, ClipboardList } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ listaCodigo: string }> };

export default async function ListaDetalhePage({ params }: Props) {
  const { listaCodigo } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("Usuario")
    .select("Usuario_nome, Usuario_email, Usuario_fotoUrl")
    .eq("Usuario_idAutenticacao", user.id)
    .maybeSingle();

  const { data: lista, error: listaErr } = await supabase
    .from("Lista")
    .select("Lista_codigo, Lista_nome, Lista_atualizadaEm")
    .eq("Lista_codigo", listaCodigo)
    .maybeSingle();

  if (listaErr || !lista) notFound();

  const { data: itensRaw } = await supabase
    .from("ListaItem")
    .select(
      "ListaItem_codigo, ListaItem_nome, ListaItem_quantidade, ListaItem_unidade, ListaItem_concluido"
    )
    .eq("ListaItem_listaCodigo", listaCodigo)
    .order("ListaItem_ordem", { ascending: true });

  const itens: ItemLinha[] = (itensRaw ?? []).map((r) => ({
    ListaItem_codigo: r.ListaItem_codigo,
    ListaItem_nome: r.ListaItem_nome,
    ListaItem_quantidade: Number(r.ListaItem_quantidade),
    ListaItem_unidade: r.ListaItem_unidade,
    ListaItem_concluido: r.ListaItem_concluido,
  }));

  const email = perfil?.Usuario_email ?? user.email ?? "";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader
        nome={perfil?.Usuario_nome ?? null}
        email={email}
        fotoUrl={perfil?.Usuario_fotoUrl ?? null}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted)] transition hover:text-[var(--accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar às listas
        </Link>

        <div className="mb-8 flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)] ring-1 ring-[var(--accent)]/25 shadow-sm">
            <ClipboardList className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <ListaTituloEditavel
              listaCodigo={lista.Lista_codigo}
              nome={lista.Lista_nome}
            />
            <p className="mt-2 text-xs text-[var(--muted)]">
              Toque no quadrado para marcar o que já pegou.
            </p>
          </div>
        </div>

        <ListaExportar
          listaCodigo={lista.Lista_codigo}
          listaNome={lista.Lista_nome}
          listaAtualizadaEm={lista.Lista_atualizadaEm}
        />

        <ListaItens listaCodigo={lista.Lista_codigo} itensIniciais={itens} />
      </main>
    </div>
  );
}
