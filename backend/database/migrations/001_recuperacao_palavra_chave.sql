-- Migração aditiva. Revisar e executar manualmente somente após autorização.
BEGIN;
CREATE TABLE IF NOT EXISTS public.recuperacao_seguranca (
  usuario_id INTEGER PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
  palavra_hash VARCHAR(255) NOT NULL,
  tentativas INTEGER NOT NULL DEFAULT 0 CHECK (tentativas BETWEEN 0 AND 5),
  bloqueado_ate TIMESTAMPTZ,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.recuperacao_seguranca ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recuperacao_seguranca FROM PUBLIC;
-- PostgreSQL local pode não possuir as roles específicas do Supabase.
DO $permissions$
DECLARE role_name TEXT;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON public.recuperacao_seguranca FROM %I', role_name);
    END IF;
  END LOOP;
END
$permissions$;
COMMIT;
