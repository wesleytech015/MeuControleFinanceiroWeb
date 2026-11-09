-- PostgreSQL/Supabase: revisão e aplicação explícitas, nunca durante o deploy.
-- Requer public.usuarios e public.movimentacoes do schema PostgreSQL da equipe.
BEGIN;
SET LOCAL search_path TO public;
CREATE TABLE IF NOT EXISTS whatsapp_links (
  usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  phone VARCHAR(20) UNIQUE,
  pending_phone VARCHAR(20),
  code_hash CHAR(64) UNIQUE,
  code_expires TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS whatsapp_drafts (
  usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  confirmation_code CHAR(12) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS whatsapp_inbox (
  message_id VARCHAR(191) COLLATE "C" PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  reply TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMPTZ,
  sending_until TIMESTAMPTZ
);
ALTER TABLE whatsapp_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_inbox ENABLE ROW LEVEL SECURITY;
-- Sem políticas públicas. Acesso pelo backend, que mantém isolamento por usuário.
COMMIT;
