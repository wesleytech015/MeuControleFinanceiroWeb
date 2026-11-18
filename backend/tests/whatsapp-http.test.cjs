const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const express = require('express');
const { createWhatsAppRouter } = require('../whatsapp/routes');

test('HTTP webhook rejects bad signatures, verifies subscriptions and protects account linking', async () => {
  const config = { verifyToken: 'test-verify-token', appSecret: 'test-app-secret', phoneNumberId: '123', timeZone: 'America/Sao_Paulo' };
  let received = 0;
  const repository = { receive: async () => { received++; }, deliver: async () => {}, status: async id => ({ vinculado: id === 7, numeroMascarado: '••••0000' }) };
  const app = express();
  app.use(express.json({ verify(req, _res, raw) { req.rawBody = raw; } }));
  app.use('/api/whatsapp', createWhatsAppRouter({ config, repository, send: async () => {}, authenticate(req, res, next) {
    if (req.get('Authorization') !== 'Bearer isolated-http-fixture') return res.sendStatus(401);
    req.usuario = { id: 7 }; next();
  } }));
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/whatsapp`;
  try {
    assert.equal((await fetch(base + '/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123')).status, 403);
    assert.equal(await (await fetch(base + '/webhook?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=123')).text(), '123');
    assert.equal((await fetch(base + '/vinculo')).status, 401);
    assert.equal((await fetch(base + '/vinculo', { headers: { Authorization: 'Bearer isolated-http-fixture' } })).status, 200);
    const body = JSON.stringify({ object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: {
      metadata: { phone_number_id: '123' }, messages: [{ id: 'wamid.test', from: '5511999990000', timestamp: String(Math.floor(Date.now() / 1000)), type: 'text', text: { body: 'despesa 15 frutas' } }],
    } }] }] });
    assert.equal((await fetch(base + '/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })).status, 403);
    assert.equal(received, 0);
    const signature = 'sha256=' + createHmac('sha256', config.appSecret).update(body).digest('hex');
    assert.equal((await fetch(base + '/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': signature }, body })).status, 200);
    assert.equal(received, 1);
    repository.receive = async () => { throw Error('private SQL detail'); };
    const failure = await fetch(base + '/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': signature }, body });
    assert.equal(failure.status, 503);
    assert.doesNotMatch(await failure.text(), /private SQL detail/);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('disabled integration rejects all routes before using a repository', async () => {
  const app = express(); app.use(createWhatsAppRouter({ config: null, repository: null, authenticate() { throw Error('Unexpected'); } }));
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  try { assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/vinculo`)).status, 503); }
  finally { await new Promise(resolve => server.close(resolve)); }
});
