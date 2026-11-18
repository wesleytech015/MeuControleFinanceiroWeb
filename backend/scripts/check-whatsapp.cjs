// Read-only preflight. Does not print secrets, migrate, send messages or enable services.
require('../config/environment').loadEnvironment();
const { configuration } = require('../whatsapp/transport');
const { configuration: geminiConfiguration } = require('../assistant/gemini');
const required = {
  usuarios: ['id'], movimentacoes: ['id', 'usuario_id', 'descricao', 'valor', 'tipo', 'data', 'categoria', 'forma_pagamento'],
  autenticacao_versoes: ['usuario_id', 'versao'],
  seguranca_limites: ['escopo', 'chave_hash', 'tentativas', 'expira_em'],
  whatsapp_links: ['usuario_id', 'phone', 'pending_phone', 'code_hash', 'code_expires', 'ai_consent_at', 'ai_window_started', 'ai_requests', 'ai_provider', 'conversation', 'conversation_updated_at'],
  whatsapp_drafts: ['usuario_id', 'payload', 'confirmation_code', 'expires_at'],
  whatsapp_inbox: ['message_id', 'phone', 'reply', 'received_at', 'sent_at', 'sending_until'],
};
if (process.env.RECOVERY_ENABLED === 'true') required.recuperacao_seguranca = ['usuario_id', 'palavra_hash', 'tentativas', 'bloqueado_ate', 'inicio_janela', 'atualizado_em'];
async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--database'].includes(arg))) throw Error('Use check:whatsapp ou check:whatsapp -- --database.');
  for (const [name, check] of [['WhatsApp', configuration], ['Gemini', geminiConfiguration]]) {
    try {
      const active = !!check();
      console.log(`${name}: ${active ? 'configuração ativa válida' : 'desabilitado'}`);
      if (!active) process.exitCode = 1;
    } catch { console.log(`${name}: configuração incompleta ou inválida`); process.exitCode = 1; }
  }
  for (const key of ['WHATSAPP_APP_SECRET', 'WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_GRAPH_VERSION']) {
    console.log(`${key}: ${process.env[key]?.trim() ? 'configurado' : 'pendente'}`);
  }
  if (args.includes('--database')) {
    let pool;
    try {
      pool = require('../database/conexao');
      const { rows } = await pool.query({ text: "SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=ANY($1::text[])", values: [Object.keys(required)], query_timeout: 8000 });
      const columns = new Set(rows.map(row => `${row.table_name}.${row.column_name}`));
      const missing = Object.entries(required).flatMap(([table, fields]) => fields.filter(field => !columns.has(`${table}.${field}`)).map(field => `${table}.${field}`));
      console.log(missing.length ? 'Banco: estrutura pendente: ' + missing.join(', ') : 'Banco: conexão e colunas exigidas confirmadas');
      if (missing.length) process.exitCode = 1;
    } catch { console.log('Banco: conexão ou leitura da estrutura falhou; confira rede, configuração e CA.'); process.exitCode = 1; }
    finally { if (pool) await pool.end(); }
  } else console.log('Banco: não consultado; use --database para conferir conexão e colunas sem escrita.');
  console.log('Este diagnóstico não comprova entrega Meta, permissão por país, validade dos tokens, webhook público nem Gemini acessível.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
