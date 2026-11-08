// Explicit opt-in: local validation MySQL only, using the application account.
// Every table gets a random namespace; existing tables and records are untouched.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomBytes, createHmac } = require('node:crypto');
const mysql = require('mysql2/promise');
const express = require('express');
const jwt = require('jsonwebtoken');
const { databaseOptions } = require('../config/databaseOptions');
const { createRepository } = require('../whatsapp/repository');
const { createWhatsAppRouter } = require('../whatsapp/routes');

async function main() {
  const envFile = process.env.WHATSAPP_TEST_ENV_FILE;
  assert.ok(envFile, 'Defina WHATSAPP_TEST_ENV_FILE para um .env de MySQL local isolado.');
  const env = require('dotenv').parse(fs.readFileSync(envFile));
  assert.equal(env.DB_HOST, '127.0.0.1', 'Teste recusado: somente loopback.');
  assert.match(env.DB_NAME, /^dashboard_test_[a-f0-9]+$/, 'Teste recusado: use o ambiente local de validação.');
  const prefix = `wa_test_${randomBytes(8).toString('hex')}_`;
  const names = ['usuarios', 'cartoes', 'movimentacoes', 'categorias', 'whatsapp_links', 'whatsapp_drafts', 'whatsapp_inbox'];
  const table = Object.fromEntries(names.map(name => [name, prefix + name]));
  const mapSql = sql => sql.replace(/\b(usuarios|cartoes|movimentacoes|categorias|whatsapp_links|whatsapp_drafts|whatsapp_inbox)\b/g, name => table[name]);
  const options = databaseOptions({ ...env, NODE_ENV: 'development', DB_SSL: 'false' });
  const setup = await mysql.createConnection({ ...options, multipleStatements: true });
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
    const [existing] = await setup.query(`SELECT table_name FROM information_schema.tables WHERE table_schema=? AND table_name IN (${names.map(() => '?').join(',')})`, [env.DB_NAME, ...Object.values(table)]);
    assert.equal(existing.length, 0, 'Namespace já existe; teste recusado.');
    const baseSchema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8')
      .replace(/CREATE DATABASE IF NOT EXISTS[^;]+;/i, '').replace(/USE meu_controle_financeiro_web;/i, '');
    await applySchema(baseSchema);
    await applySchema(fs.readFileSync(path.join(__dirname, '../database/migrations/20261108_whatsapp.sql'), 'utf8'));
    const rawPool = mysql.createPool(options);
    // Only identifiers change in this fixture. Run the real repository SQL and transactions.
    const mapped = connection => ({
      query: (sql, params) => connection.query(mapSql(sql), params),
      execute: (sql, params) => connection.execute(mapSql(sql), params),
      beginTransaction: () => connection.beginTransaction(), commit: () => connection.commit(),
      rollback: () => connection.rollback(), release: () => connection.release(),
    });
    pool = { ...mapped(rawPool), getConnection: async () => mapped(await rawPool.getConnection()), end: () => rawPool.end() };
    const [user] = await pool.execute('INSERT INTO usuarios (nome,email,senha) VALUES (?,?,?)', ['WhatsApp Test', 'whatsapp-test@example.invalid', 'not-a-login-password']);
    const [other] = await pool.execute('INSERT INTO usuarios (nome,email,senha) VALUES (?,?,?)', ['Other Test', 'other-test@example.invalid', 'not-a-login-password']);
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
    const token = jwt.sign({ id: user.insertId }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const otherToken = jwt.sign({ id: other.insertId }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const auth = token => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
    const count = async () => Number((await pool.query('SELECT COUNT(*) n FROM movimentacoes'))[0][0].n);
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
    const pair = await (await fetch(base + '/vinculo', { method: 'POST', headers: auth(token), body: JSON.stringify({ numero: number, usuario_id: other.insertId }) })).json();
    check(pair.codigo?.length === 32, 'Código de vínculo retornado.');
    check((await post(envelope(pair.comando, '5511999991111'))).status === 200, 'Outro remetente não pode consumir código.');
    check(!(await repository.status(user.insertId)).vinculado, 'Vínculo ainda não efetuado.');
    await post(envelope(pair.comando));
    check((await repository.status(user.insertId)).vinculado, 'Vínculo efetuado pelo número correto.');
    check(!(await repository.status(other.insertId)).vinculado, 'ID enviado no corpo não troca a conta autenticada.');
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
    const [saved] = await pool.query('SELECT usuario_id,valor,categoria FROM movimentacoes');
    check(saved[0].usuario_id === user.insertId && saved[0].valor === '15.00' && saved[0].categoria === 'Alimentação', 'Valor e proprietário persistidos.');
    await post(envelope(`confirmar ${code}`));
    check(await count() === 1, 'Código já consumido não grava novamente.');
    await post(envelope('resumo', '5511999992222'));
    check(!replies.at(-1).includes('15,00'), 'Número não vinculado não recebe resumo.');
    await post(envelope('resumo'));
    check(replies.at(-1).includes('-R$ 15,00'), 'Resumo usa dados persistidos.');
    const otherPair = await (await fetch(base + '/vinculo', { method: 'POST', headers: auth(otherToken), body: JSON.stringify({ numero: number }) })).json();
    await post(envelope(otherPair.comando));
    check(!(await repository.status(other.insertId)).vinculado, 'Não pode roubar número vinculado a outra conta.');
    await post(envelope('receita 30 teste'));
    await post(envelope('cancelar'));
    check(await count() === 1, 'Cancelamento não grava.');
    const failedReply = envelope('despesa 2 teste'); failSend = true;
    check((await post(failedReply)).status === 503, 'Falha no transporte permite retry.');
    const [before] = await pool.query('SELECT confirmation_code FROM whatsapp_drafts WHERE usuario_id=?', [user.insertId]);
    failSend = false;
    await post(failedReply);
    const [after] = await pool.query('SELECT confirmation_code FROM whatsapp_drafts WHERE usuario_id=?', [user.insertId]);
    check(before[0].confirmation_code === after[0].confirmation_code, 'Retry entrega a mesma proposta, sem refazer o processamento.');
    await pool.execute('UPDATE whatsapp_drafts SET expires_at=DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 MINUTE) WHERE usuario_id=?', [user.insertId]);
    await post(envelope(`confirmar ${after[0].confirmation_code}`));
    check(await count() === 1, 'Proposta expirada não grava.');
    const freshRepository = createRepository(pool);
    check((await freshRepository.status(user.insertId)).vinculado, 'Instância nova mantém vínculo no banco.');
    await fetch(base + '/vinculo', { method: 'DELETE', headers: auth(token) });
    check(!(await freshRepository.status(user.insertId)).vinculado, 'Desvinculação persistida.');
    check(Number((await pool.query('SELECT COUNT(*) n FROM whatsapp_drafts'))[0][0].n) === 0, 'Desvinculação remove pendência.');
    console.log(`${checks} verificações aprovadas com HTTP e MySQL locais reais; transporte Meta simulado.`);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (pool) await pool.end();
    try {
      for (const name of [...createdTables].reverse()) {
        await setup.query(`DROP TABLE IF EXISTS \`${table[name]}\``);
      }
    } finally { await setup.end(); }
  }
}
main().catch(error => {
  console.error('Integração local falhou:', error instanceof assert.AssertionError ? error.message : (error.code || error.name));
  process.exitCode = 1;
});
