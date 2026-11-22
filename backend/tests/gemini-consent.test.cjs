const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRepository } = require('../whatsapp/repository');
const { processMessage } = require('../whatsapp/processor');

test('Gemini consent never reuses Qwen authorization or its budget', async () => {
  const statements = [];
  let storedProvider = 'qwen', consent = true;
  const db = { release() {}, async query(sql, args) {
    statements.push({ sql, args });
    if (/INSERT INTO whatsapp_inbox/.test(sql)) return { rowCount: 1, rows: [] };
    if (/SET ai_consent_at=CASE/.test(sql)) { storedProvider = args[1] ? args[2] : null; consent = args[1]; }
    if (/SELECT ai_consent_at/.test(sql)) return { rows: storedProvider === args[1] && consent ? [{ ai_consent_at: new Date() }] : [] };
    if (/SET\s+ai_requests=CASE/.test(sql)) return { rowCount: storedProvider === args[1] && consent ? 1 : 0, rows: [] };
    return { rowCount: 1, rows: [] };
  } };
  const repository = createRepository({ connect: async () => db });
  await repository.receive({ id: 'consent-fixture', from: '5511999990000' }, async store => {
    assert.equal(await store.aiConsent(7), false);
    assert.equal(await store.consumeAiBudget(7), false);
    await store.setAiConsent(7, true);
    assert.equal(storedProvider, 'gemini');
    assert.equal(await store.aiConsent(7), true);
    assert.equal(await store.consumeAiBudget(7), true);
    await store.setAiConsent(7, false);
    assert.equal(await store.aiConsent(7), false);
  });
  assert.ok(statements.some(({ sql, args }) => /ai_provider=\$2/.test(sql) && args[1] === 'gemini'));
  assert.throws(() => createRepository({}, 'unknown'));
});

test('WhatsApp consent explicitly names Google Gemini', async () => {
  const now = new Date(); let enabled;
  const store = { account: async () => ({ usuario_id: 7 }), setAiConsent: async (_id, value) => { enabled = value; } };
  const message = text => ({ from: '5511999990000', text, timestamp: String(Math.floor(now.getTime() / 1000)) });
  const options = { now, assistant: async () => {} };
  assert.match(await processMessage(store, message('ia ativar'), options), /Google Gemini/);
  assert.equal(enabled, true);
  assert.match(await processMessage(store, message('ia desativar'), options), /Google Gemini/);
  assert.equal(enabled, false);
});
