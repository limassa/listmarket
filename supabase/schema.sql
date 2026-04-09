-- =============================================================================
-- Lista de mercado — padrão de nomes em português
-- Tabela: Lista | Colunas: Lista_campo (ex.: Lista_codigo, Lista_nome)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public."Usuario" (
  "Usuario_codigo" uuid NOT NULL DEFAULT gen_random_uuid(),
  "Usuario_idAutenticacao" uuid NOT NULL,
  "Usuario_email" text NOT NULL,
  "Usuario_nome" text,
  "Usuario_fotoUrl" text,
  "Usuario_criadoEm" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "Usuario_pkey" PRIMARY KEY ("Usuario_codigo"),
  CONSTRAINT "Usuario_idAutenticacao_key" UNIQUE ("Usuario_idAutenticacao"),
  CONSTRAINT "Usuario_idAutenticacao_fkey" FOREIGN KEY ("Usuario_idAutenticacao")
    REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public."Lista" (
  "Lista_codigo" uuid NOT NULL DEFAULT gen_random_uuid(),
  "Lista_usuarioCodigo" uuid NOT NULL,
  "Lista_nome" text NOT NULL,
  "Lista_criadaEm" timestamptz NOT NULL DEFAULT now(),
  "Lista_atualizadaEm" timestamptz NOT NULL DEFAULT now(),
  "Lista_arquivada" boolean NOT NULL DEFAULT false,
  CONSTRAINT "Lista_pkey" PRIMARY KEY ("Lista_codigo"),
  CONSTRAINT "Lista_usuarioCodigo_fkey" FOREIGN KEY ("Lista_usuarioCodigo")
    REFERENCES public."Usuario" ("Usuario_codigo") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public."ListaItem" (
  "ListaItem_codigo" uuid NOT NULL DEFAULT gen_random_uuid(),
  "ListaItem_listaCodigo" uuid NOT NULL,
  "ListaItem_nome" text NOT NULL,
  "ListaItem_quantidade" numeric NOT NULL DEFAULT 1,
  "ListaItem_unidade" text NOT NULL DEFAULT 'un',
  "ListaItem_concluido" boolean NOT NULL DEFAULT false,
  "ListaItem_ordem" integer NOT NULL DEFAULT 0,
  "ListaItem_criadoEm" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "ListaItem_pkey" PRIMARY KEY ("ListaItem_codigo"),
  CONSTRAINT "ListaItem_listaCodigo_fkey" FOREIGN KEY ("ListaItem_listaCodigo")
    REFERENCES public."Lista" ("Lista_codigo") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Lista_Lista_usuarioCodigo_idx" ON public."Lista" ("Lista_usuarioCodigo");
CREATE INDEX IF NOT EXISTS "ListaItem_ListaItem_listaCodigo_idx" ON public."ListaItem" ("ListaItem_listaCodigo");

-- Perfil ao cadastrar (email ou Google)
CREATE OR REPLACE FUNCTION public."fn_Usuario_aposAutenticacao"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."Usuario" (
    "Usuario_idAutenticacao",
    "Usuario_email",
    "Usuario_nome",
    "Usuario_fotoUrl"
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NULLIF(trim(split_part(COALESCE(NEW.email, ''), '@', 1)), '')
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT ("Usuario_idAutenticacao") DO UPDATE SET
    "Usuario_email" = EXCLUDED."Usuario_email",
    "Usuario_nome" = COALESCE(EXCLUDED."Usuario_nome", public."Usuario"."Usuario_nome"),
    "Usuario_fotoUrl" = COALESCE(EXCLUDED."Usuario_fotoUrl", public."Usuario"."Usuario_fotoUrl");
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trg_Usuario_aposAutenticacao" ON auth.users;
CREATE TRIGGER "trg_Usuario_aposAutenticacao"
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public."fn_Usuario_aposAutenticacao"();

ALTER TABLE public."Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Lista" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ListaItem" ENABLE ROW LEVEL SECURITY;

-- Usuario: só o próprio
CREATE POLICY "Usuario_select_proprio" ON public."Usuario"
  FOR SELECT USING ("Usuario_idAutenticacao" = auth.uid());

CREATE POLICY "Usuario_update_proprio" ON public."Usuario"
  FOR UPDATE USING ("Usuario_idAutenticacao" = auth.uid());

-- Lista: dono
CREATE POLICY "Lista_select_dono" ON public."Lista"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Usuario" u
      WHERE u."Usuario_codigo" = "Lista"."Lista_usuarioCodigo"
        AND u."Usuario_idAutenticacao" = auth.uid()
    )
  );

CREATE POLICY "Lista_insert_dono" ON public."Lista"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Usuario" u
      WHERE u."Usuario_codigo" = "Lista"."Lista_usuarioCodigo"
        AND u."Usuario_idAutenticacao" = auth.uid()
    )
  );

CREATE POLICY "Lista_update_dono" ON public."Lista"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public."Usuario" u
      WHERE u."Usuario_codigo" = "Lista"."Lista_usuarioCodigo"
        AND u."Usuario_idAutenticacao" = auth.uid()
    )
  );

CREATE POLICY "Lista_delete_dono" ON public."Lista"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public."Usuario" u
      WHERE u."Usuario_codigo" = "Lista"."Lista_usuarioCodigo"
        AND u."Usuario_idAutenticacao" = auth.uid()
    )
  );

-- ListaItem: listas do dono
CREATE POLICY "ListaItem_select_dono" ON public."ListaItem"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Lista" l
      JOIN public."Usuario" u ON u."Usuario_codigo" = l."Lista_usuarioCodigo"
      WHERE l."Lista_codigo" = "ListaItem"."ListaItem_listaCodigo"
        AND u."Usuario_idAutenticacao" = auth.uid()
    )
  );

CREATE POLICY "ListaItem_insert_dono" ON public."ListaItem"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Lista" l
      JOIN public."Usuario" u ON u."Usuario_codigo" = l."Lista_usuarioCodigo"
      WHERE l."Lista_codigo" = "ListaItem"."ListaItem_listaCodigo"
        AND u."Usuario_idAutenticacao" = auth.uid()
    )
  );

CREATE POLICY "ListaItem_update_dono" ON public."ListaItem"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public."Lista" l
      JOIN public."Usuario" u ON u."Usuario_codigo" = l."Lista_usuarioCodigo"
      WHERE l."Lista_codigo" = "ListaItem"."ListaItem_listaCodigo"
        AND u."Usuario_idAutenticacao" = auth.uid()
    )
  );

CREATE POLICY "ListaItem_delete_dono" ON public."ListaItem"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public."Lista" l
      JOIN public."Usuario" u ON u."Usuario_codigo" = l."Lista_usuarioCodigo"
      WHERE l."Lista_codigo" = "ListaItem"."ListaItem_listaCodigo"
        AND u."Usuario_idAutenticacao" = auth.uid()
    )
  );
