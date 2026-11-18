const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const express = require('express');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { deliveryFailures } = require('../whatsapp/diagnostics');
const { createWhatsAppRouter } = require('../whatsapp/routes');
const body = (phone = '123') => ({ object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: {
  metadata: { phone_number_id: phone }, statuses: [{ id: 'private-message-id', recipient_id: 'private-phone', status: 'failed',
    errors: [{ code: 130497, title: 'private-provider-text', error_data: { details: 'private-detail' } }] }],
} }] }] });
test('delivery diagnostics exposes numeric codes and fixed labels only for our number', () => {
  assert.deepEqual(deliveryFailures(body(), '123'), [{ event: 'whatsapp_delivery_failure', code: 130497, category: 'country_restriction' }]);
  assert.deepEqual(deliveryFailures(body('other'), '123'), []);
  const input = body();
  input.entry[0].changes[0].value.statuses[0].status = 'delivered';
  assert.deepEqual(deliveryFailures(input, '123'), []);
  input.entry[0].changes[0].value.statuses[0] = { status: 'failed', errors: [{ code: 'private' }, { code: -1 }, { code: 999999 }, { code: 999999 }] };
  assert.deepEqual(deliveryFailures(input, '123'), [{ event: 'whatsapp_delivery_failure', code: 999999, category: 'unknown' }]);
  assert.deepEqual(deliveryFailures({ object: 'whatsapp_business_account', entry: [null] }, '123'), []);
});
test('signed failed status is acknowledged without account access or financial writes; unsigned status is rejected', async () => {
  const config = { appSecret: 'isolated-status-test', phoneNumberId: '123' };
  const events = [];
  const app = express();
  app.use(express.json({ verify(req, _res, raw) { req.rawBody = raw; } }));
  const unexpected = () => { throw Error('Status must not access a financial account'); };
  app.use(createWhatsAppRouter({ config, authenticate: unexpected, repository: { receive: unexpected, deliver: unexpected },
    send: unexpected, onDeliveryFailure: event => events.push(event) }));
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  try {
    const raw = JSON.stringify(body());
    const url = `http://127.0.0.1:${server.address().port}/webhook`;
    assert.equal((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw })).status, 403);
    assert.equal(events.length, 0);
    const response = await fetch(url, { method: 'POST', body: raw, headers: { 'Content-Type': 'application/json',
      'X-Hub-Signature-256': 'sha256=' + createHmac('sha256', config.appSecret).update(raw).digest('hex') } });
    assert.equal(response.status, 200);
    assert.deepEqual(events, [{ event: 'whatsapp_delivery_failure', code: 130497, category: 'country_restriction' }]);
    assert.doesNotMatch(JSON.stringify(events), /private/);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('WhatsApp preflight checks readiness without disclosing secrets or requiring a database', () => {
  const env = { ...process.env, WHATSAPP_ENABLED: 'true', WHATSAPP_APP_SECRET: 'private-app-secret-fixture',
    WHATSAPP_VERIFY_TOKEN: 'private-verify-fixture', WHATSAPP_ACCESS_TOKEN: 'private-access-fixture',
    WHATSAPP_PHONE_NUMBER_ID: '123', WHATSAPP_GRAPH_VERSION: 'v25.0', WHATSAPP_TIMEZONE: 'America/Sao_Paulo',
    GEMINI_ENABLED: 'true', GEMINI_API_KEY: 'private-gemini-fixture', GEMINI_MODEL: 'gemini-fixture' };
  const command = path.resolve(__dirname, '../scripts/check-whatsapp.cjs');
  const run = spawnSync(process.execPath, [command], { env, encoding: 'utf8', timeout: 10000, windowsHide: true });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /Banco: não consultado/);
  assert.doesNotMatch(run.stdout + run.stderr, /private-.*-fixture/);
  const disabled = spawnSync(process.execPath, [command], { env: { ...env, WHATSAPP_ENABLED: 'false' }, encoding: 'utf8', timeout: 10000, windowsHide: true });
  assert.equal(disabled.status, 1);
  assert.match(disabled.stdout, /WhatsApp: desabilitado/);
});
