-- Aplicar explicitamente em demonstração, após a migração WhatsApp de 09/11.
-- Não executada automaticamente por deploy. Não altera movimentações.
BEGIN;
SET LOCAL search_path TO public;
ALTER TABLE whatsapp_links ADD COLUMN IF NOT EXISTS ai_consent_at TIMESTAMPTZ;
ALTER TABLE whatsapp_links ADD COLUMN IF NOT EXISTS ai_window_started TIMESTAMPTZ;
ALTER TABLE whatsapp_links ADD COLUMN IF NOT EXISTS ai_requests INTEGER NOT NULL DEFAULT 0;
ALTER TABLE whatsapp_links ADD COLUMN IF NOT EXISTS ai_provider TEXT;
COMMIT;
