import { createClient } from "@/lib/supabase/server";
import {
  LISTAS_RECENTES_PARA_SUGESTAO,
  MAX_ITENS_SUGERIDOS_NA_NOVA_LISTA,
} from "@/lib/lista-sugestoes";
import { AppHeader } from "@/components/app-header";
import { ListaCard } from "@/components/lista-card";
import { NovaListaForm } from "@/components/nova-lista-form";
import { ListTodo, ShoppingBasket } from "lucide-react";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("Usuario")
    .select("Usuario_codigo, Usuario_nome, Usuario_email, Usuario_fotoUrl")
    .eq("Usuario_idAutenticacao", user.id)
    .maybeSingle();

  const { data: listas } = await supabase
    .from("Lista")
    .select(
      `
      Lista_codigo,
      Lista_nome,
      Lista_atualizadaEm,
      ListaItem ( ListaItem_codigo )
    `
    )
    .eq("Lista_arquivada", false)
    .order("Lista_atualizadaEm", { ascending: false });

  const email = perfil?.Usuario_email ?? user.email ?? "";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader
        nome={perfil?.Usuario_nome ?? null}
        email={email}
        fotoUrl={perfil?.Usuario_fotoUrl ?? null}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {!perfil ? (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Seu perfil ainda não apareceu no banco. Rode o SQL em{" "}
            <code className="rounded bg-slate-200/80 px-1.5 py-0.5 text-xs text-slate-800">
              supabase/schema.sql
            </code>{" "}
            no painel Supabase e faça login de novo.
          </div>
        ) : null}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              <ShoppingBasket className="h-4 w-4" strokeWidth={2} />
              Suas listas
            </p>
            <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
              O que falta no mercado?
            </h1>
          </div>
        </div>

        <div className="mb-10 space-y-2">
          <NovaListaForm />
          <p className="text-xs leading-relaxed text-[var(--muted)]">
            Cada lista nova pode vir com até {MAX_ITENS_SUGERIDOS_NA_NOVA_LISTA} itens sugeridos: os
            que aparecem com mais frequência nas suas últimas {LISTAS_RECENTES_PARA_SUGESTAO} listas
            (nome, quantidade e unidade da ocorrência mais recente).
          </p>
        </div>

        <section className="space-y-3" aria-label="Listas de compras">
          {!listas?.length ? (
            <div className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-[var(--elevated)] px-6 py-16 text-center shadow-sm">
              <ListTodo
                className="mx-auto mb-4 h-12 w-12 text-[var(--muted)]"
                strokeWidth={1.25}
              />
              <p className="text-sm font-medium text-[var(--ink)]">
                Nenhuma lista ainda
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Crie uma acima e abra no celular na hora do mercado.
              </p>
            </div>
          ) : (
            listas.map((row) => {
              const itens = row.ListaItem as unknown as { ListaItem_codigo: string }[];
              const total = Array.isArray(itens) ? itens.length : 0;
              return (
                <ListaCard
                  key={row.Lista_codigo}
                  codigo={row.Lista_codigo}
                  nome={row.Lista_nome}
                  atualizadaEm={row.Lista_atualizadaEm}
                  totalItens={total}
                />
              );
            })
          )}
        </section>

        <p className="mt-12 text-center text-xs text-[var(--muted)]">
          Dica: adicione o app à tela inicial do celular para acesso rápido.
        </p>
      </main>
    </div>
  );
}
