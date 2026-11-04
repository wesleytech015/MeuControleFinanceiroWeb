const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { validateTransaction } = require('../validation/transacao');
const valid = { descricao: 'Salário', valor: '10.50', tipo: 'receita', data: '2024-02-29' };

test('rejects malformed amounts, dates, descriptions and optional fields', () => {
  for (const patch of [{ valor: true }, { valor: [1] }, { valor: 0.001 }, { valor: -1 }, { valor: 0 }, { valor: '1e2' }, { valor: '10000000000000' }, { data: '2026-02-29' }, { data: '2026-02-30' }, { data: null }, { data: true }, { descricao: ' ' }, { descricao: 1 }, { descricao: 'x'.repeat(201) }, { categoria: [] }, { forma_pagamento: 'x'.repeat(51) }]) {
    assert.throws(() => validateTransaction({ ...valid, ...patch }));
  }
});
test('preserves exact DECIMAL bounds and valid dates', () => {
  assert.equal(validateTransaction({ ...valid, valor: '9999999999999.99' }).valor, '9999999999999.99');
  assert.equal(validateTransaction({ ...valid, valor: 0.01 }).valor, '0.01');
  assert.equal(validateTransaction(valid).data, '2024-02-29');
  assert.match(validateTransaction({ ...valid, data: undefined }).data, /^\d{4}-\d{2}-\d{2}$/);
});
test('missing/short JWT secret prevents startup', () => {
  for (const secret of ['', 'short']) {
    const child = spawnSync(process.execPath, ['-e', "require('./config/security')"], { cwd: require('node:path').resolve(__dirname, '..'), env: { ...process.env, JWT_SECRET: secret }, encoding: 'utf8' });
    assert.notEqual(child.status, 0); assert.match(child.stderr, /Configure JWT_SECRET/);
  }
});
test('registration rejects truncated bcrypt passwords and invalid data', () => {
  const { registration } = require('../middlewares/authInput');
  for (const patch of [{ senha: 'x'.repeat(73) }, { senha: 'á'.repeat(37) }, { senha: '1234567' }, { nome: ' ' }, { email: 'invalid' }]) {
    let status; let next = false;
    registration({ body: { nome: 'Teste', email: 't@example.invalid', senha: 'strong-password', ...patch } }, { status(code) { status = code; return this; }, json() {} }, () => { next = true; });
    assert.equal(status, 400); assert.equal(next, false);
  }
});

test('authentication limiter blocks after the configured failure budget', async () => {
  const express = require('express');
  const { createAuthLimiter } = require('../middlewares/authRateLimit');
  const app = express();
  app.post('/login', createAuthLimiter(2), (_req, res) => res.sendStatus(401));
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  try {
    const url = `http://127.0.0.1:${server.address().port}/login`;
    assert.equal((await fetch(url, { method: 'POST' })).status, 401);
    assert.equal((await fetch(url, { method: 'POST' })).status, 401);
    const blocked = await fetch(url, { method: 'POST', headers: { 'X-Forwarded-For': '203.0.113.1' } });
    assert.equal(blocked.status, 429); assert.ok(blocked.headers.get('retry-after'));
  } finally { await new Promise(resolve => server.close(resolve)); }
});
