-- Preparação somente. Não executar em produção sem revisão e autorização.
-- Pré-requisito: 001_recuperacao_palavra_chave.sql e public.usuarios(id INTEGER).
-- Aplicação única e atômica: uma reaplicação deve falhar e sofrer ROLLBACK.
-- Não usar IF NOT EXISTS para mascarar tabelas/constraints de estrutura divergente.
-- Conferir o catálogo antes da aplicação; se falhar, encerrar com ROLLBACK.
BEGIN;
SET LOCAL search_path TO public;

ALTER TABLE public.recuperacao_seguranca ADD COLUMN IF NOT EXISTS inicio_janela TIMESTAMPTZ;
-- NOT VALID preserva registros legados; novas gravações já respeitam as invariantes.
-- Revisar registros legados em homologação antes de VALIDATE CONSTRAINT.
ALTER TABLE public.recuperacao_seguranca ADD CONSTRAINT recuperacao_janela_consistente
  CHECK ((tentativas = 0 AND inicio_janela IS NULL AND bloqueado_ate IS NULL)
    OR (tentativas BETWEEN 1 AND 4 AND inicio_janela IS NOT NULL AND bloqueado_ate IS NULL)
    OR (tentativas = 5 AND inicio_janela IS NOT NULL AND bloqueado_ate IS NOT NULL)) NOT VALID;

-- Sem backfill nem UPDATE na tabela usuarios. Ausência de linha equivale à versão zero.
CREATE TABLE public.autenticacao_versoes (
  usuario_id INTEGER PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL DEFAULT 0 CHECK (versao >= 0)
);
CREATE TABLE public.seguranca_limites (
  escopo VARCHAR(64) NOT NULL,
  chave_hash CHAR(64) NOT NULL,
  tentativas INTEGER NOT NULL CHECK (tentativas BETWEEN 1 AND 1000000),
  expira_em TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (escopo, chave_hash)
);
CREATE INDEX seguranca_limites_expira_em_idx ON public.seguranca_limites (expira_em);
ALTER TABLE public.autenticacao_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguranca_limites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.autenticacao_versoes, public.seguranca_limites FROM PUBLIC;
DO $permissions$
DECLARE role_name TEXT;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON public.autenticacao_versoes, public.seguranca_limites FROM %I', role_name);
    END IF;
  END LOOP;
END
$permissions$;
-- Uma role de backend restrita exige GRANTs e políticas RLS explícitos, revisados.
-- Não habilitar fallback permissivo se as tabelas/permissões estiverem ausentes.
COMMIT;
