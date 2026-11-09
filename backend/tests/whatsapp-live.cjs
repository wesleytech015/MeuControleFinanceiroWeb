// Explicit opt-in: local validation PostgreSQL only, using the application account.
// Every table gets a random namespace; existing tables and records are untouched.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomBytes, createHmac } = require('node:crypto');
const { Pool, Client } = require('pg');
const express = require('express');
const jwt = require('jsonwebtoken');
const { databaseOptions } = require('../config/databaseOptions');
const { createRepository } = require('../whatsapp/repository');
const { createWhatsAppRouter } = require('../whatsapp/routes');

async function main() {
  const envFile = process.env.WHATSAPP_TEST_ENV_FILE;
  assert.ok(envFile, 'Defina WHATSAPP_TEST_ENV_FILE para um .env de PostgreSQL local isolado.');
  const env = require('dotenv').parse(fs.readFileSync(envFile));
  assert.equal(env.DB_HOST, '127.0.0.1', 'Teste recusado: somente loopback.');
  assert.match(env.DB_NAME, /^dashboard_test_[a-f0-9]+$/, 'Teste recusado: use o ambiente local de validação.');
  const prefix = `wa_test_${randomBytes(8).toString('hex')}_`;
  const names = ['usuarios', 'cartoes', 'movimentacoes', 'categorias', 'whatsapp_links', 'whatsapp_drafts', 'whatsapp_inbox'];
  const table = Object.fromEntries(names.map(name => [name, prefix + name]));
  const mapSql = sql => sql.replace(/\b(idx_cartoes_usuario|idx_movimentacoes_usuario_data|uk_categoria)\b/g, name => prefix + name).replace(/\b(usuarios|cartoes|movimentacoes|categorias|whatsapp_links|whatsapp_drafts|whatsapp_inbox)\b/g, name => table[name]);
  const options = databaseOptions({ ...env, NODE_ENV: 'development', DB_SSL: 'false' });
  const setup = new Client(options);
  await setup.connect();
  let pool, server;
  const createdTables = [];
  async function applySchema(sql) {
    for (const statement of sql.replace(/^\s*--.*$/gm, '').split(';').map(value => value.trim()).filter(Boolean)) {
      await setup.query(mapSql(statement));
      const created = /^CREATE TABLE IF NOT EXISTS (\w+)/i.exec(statement);
      if (created) createdTables.push(created[1]);
    }
  }
  let checks = 0;
  const check = (condition, message) => { assert.ok(condition, message); checks++; };
  try {
    const { rows: existing } = await setup.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY($1::text[])", [Object.values(table)]);
    assert.equal(existing.length, 0, 'Namespace já existe; teste recusado.');
    const baseSchema = fs.readFileSync(path.join(__dirname, '../database/schema.postgresql.sql'), 'utf8')
      .replace(/CREATE DATABASE IF NOT EXISTS[^;]+;/i, '').replace(/USE meu_controle_financeiro_web;/i, '');
    await applySchema(baseSchema);
    await applySchema(fs.readFileSync(path.join(__dirname, '../database/migrations/20261109_whatsapp.postgresql.sql'), 'utf8'));
    const rawPool = new Pool(options);
    // Only identifiers change in this fixture. Run the real repository SQL and transactions.
    const mapped = connection => ({
      query: (sql, params) => connection.query(mapSql(sql), params),
      release: () => connection.release(),
    });
    pool = { ...mapped(rawPool), connect: async () => mapped(await rawPool.connect()), end: () => rawPool.end() };
    const user = (await pool.query('INSERT INTO usuarios (nome,email,senha) VALUES ($1,$2,$3) RETURNING id', ['WhatsApp Test', 'whatsapp-test@example.invalid', 'not-a-login-password'])).rows[0];
    const other = (await pool.query('INSERT INTO usuarios (nome,email,senha) VALUES ($1,$2,$3) RETURNING id', ['Other Test', 'other-test@example.invalid', 'not-a-login-password'])).rows[0];
    process.env.JWT_SECRET = randomBytes(32).toString('hex');
    const authenticate = require('../middlewares/autenticar');
    const repository = createRepository(pool);
    const config = { appSecret: randomBytes(32).toString('hex'), verifyToken: 'isolated-verification', phoneNumberId: '123', timeZone: 'America/Sao_Paulo' };
    const replies = [];
    let failSend = false;
    const app = express();
    app.use(express.json({ verify(req, _res, raw) { req.rawBody = raw; } }));
    app.use('/api/whatsapp', createWhatsAppRouter({ config, repository, authenticate, send: async (_phone, reply) => {
      if (failSend) throw Error('Isolated transport failure'); replies.push(reply);
    } }));
    app.use((_error, _req, res, _next) => res.status(500).json({ erro: 'Falha no teste.' }));
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const base = `http://127.0.0.1:${server.address().port}/api/whatsapp`;
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const otherToken = jwt.sign({ id: other.id }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const auth = token => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
    const count = async () => Number((await pool.query('SELECT COUNT(*) n FROM movimentacoes')).rows[0].n);
    const number = '5511999990000';
    let seq = 0;
    function envelope(text, from = number, id = `wamid.local.${++seq}`) {
      const body = JSON.stringify({ object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: {
        metadata: { phone_number_id: '123' }, messages: [{ id, from, type: 'text', timestamp: String(Math.floor(Date.now() / 1000)), text: { body: text } }],
      } }] }] });
      return { body, signature: 'sha256=' + createHmac('sha256', config.appSecret).update(body).digest('hex') };
    }
    const post = value => fetch(base + '/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': value.signature }, body: value.body, signal: AbortSignal.timeout(10000) });
    check((await fetch(base + '/vinculo')).status === 401, 'Vínculo deve exigir JWT.');
    const pair = await (await fetch(base + '/vinculo', { method: 'POST', headers: auth(token), body: JSON.stringify({ numero: number, usuario_id: other.id }) })).json();
    check(pair.codigo?.length === 32, 'Código de vínculo retornado.');
    check((await post(envelope(pair.comando, '5511999991111'))).status === 200, 'Outro remetente não pode consumir código.');
    check(!(await repository.status(user.id)).vinculado, 'Vínculo ainda não efetuado.');
    await post(envelope(pair.comando));
    check((await repository.status(user.id)).vinculado, 'Vínculo efetuado pelo número correto.');
    check(!(await repository.status(other.id)).vinculado, 'ID enviado no corpo não troca a conta autenticada.');
    const command = envelope('compra 15 reais frutas');
    await post(command);
    check(await count() === 0, 'Proposta não pode gravar.');
    const code = /confirmar ([a-f0-9]{12})/.exec(replies.at(-1))[1];
    await post(command);
    check(await count() === 0, 'Reentrega de proposta não pode gravar.');
    const confirmation = envelope(`confirmar ${code}`);
    const concurrent = await Promise.all([post(confirmation), post(confirmation)]);
    check(concurrent.every(r => r.status === 200), 'Reentregas concorrentes aceitas.');
    check(await count() === 1, 'Confirmação concorrente grava exatamente uma vez.');
    const { rows: saved } = await pool.query('SELECT usuario_id,valor,categoria FROM movimentacoes');
    check(saved[0].usuario_id === user.id && saved[0].valor === '15.00' && saved[0].categoria === 'Alimentação', 'Valor e proprietário persistidos.');
    await post(envelope(`confirmar ${code}`));
    check(await count() === 1, 'Código já consumido não grava novamente.');
    await post(envelope('resumo', '5511999992222'));
    check(!replies.at(-1).includes('15,00'), 'Número não vinculado não recebe resumo.');
    await post(envelope('resumo'));
    check(replies.at(-1).includes('-R$ 15,00'), 'Resumo usa dados persistidos.');
    const otherPair = await (await fetch(base + '/vinculo', { method: 'POST', headers: auth(otherToken), body: JSON.stringify({ numero: number }) })).json();
    await post(envelope(otherPair.comando));
    check(!(await repository.status(other.id)).vinculado, 'Não pode roubar número vinculado a outra conta.');
    await post(envelope('receita 30 teste'));
    await post(envelope('cancelar'));
    check(await count() === 1, 'Cancelamento não grava.');
    const failedReply = envelope('despesa 2 teste'); failSend = true;
    check((await post(failedReply)).status === 503, 'Falha no transporte permite retry.');
    const { rows: before } = await pool.query('SELECT confirmation_code FROM whatsapp_drafts WHERE usuario_id=$1', [user.id]);
    failSend = false;
    await post(failedReply);
    const { rows: after } = await pool.query('SELECT confirmation_code FROM whatsapp_drafts WHERE usuario_id=$1', [user.id]);
    check(before[0].confirmation_code === after[0].confirmation_code, 'Retry entrega a mesma proposta, sem refazer o processamento.');
    await pool.query(`UPDATE whatsapp_drafts SET expires_at=CURRENT_TIMESTAMP - INTERVAL '1 minute' WHERE usuario_id=$1`, [user.id]);
    await post(envelope(`confirmar ${after[0].confirmation_code}`));
    check(await count() === 1, 'Proposta expirada não grava.');
    const freshRepository = createRepository(pool);
    check((await freshRepository.status(user.id)).vinculado, 'Instância nova mantém vínculo no banco.');
    await fetch(base + '/vinculo', { method: 'DELETE', headers: auth(token) });
    check(!(await freshRepository.status(user.id)).vinculado, 'Desvinculação persistida.');
    check(Number((await pool.query('SELECT COUNT(*) n FROM whatsapp_drafts')).rows[0].n) === 0, 'Desvinculação remove pendência.');
    console.log(`${checks} verificações aprovadas com HTTP e PostgreSQL locais reais; transporte Meta simulado.`);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (pool) await pool.end();
    try {
      await setup.query('ROLLBACK');
      for (const name of [...createdTables].reverse()) {
        await setup.query(`DROP TABLE IF EXISTS "${table[name]}"`);
      }
    } finally { await setup.end(); }
  }
}
main().catch(error => {
  console.error('Integração local falhou:', error instanceof assert.AssertionError ? error.message : (error.code || error.name));
  process.exitCode = 1;
});
