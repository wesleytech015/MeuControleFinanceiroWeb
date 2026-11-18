-- Aplicação explícita somente após revisão; nunca durante o deploy.
-- Requer as migrações WhatsApp de 09/11 e IA de 14/11.
BEGIN;
SET LOCAL search_path TO public;
ALTER TABLE whatsapp_links ADD COLUMN IF NOT EXISTS conversation JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE whatsapp_links ADD COLUMN IF NOT EXISTS conversation_updated_at TIMESTAMPTZ;
COMMIT;
