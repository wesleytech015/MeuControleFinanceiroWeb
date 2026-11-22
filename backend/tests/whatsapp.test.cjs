const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { parseCommand, today, money } = require('../whatsapp/commands');
const { processMessage } = require('../whatsapp/processor');
const { configuration, validSignature, messages, createSender } = require('../whatsapp/transport');
const { phone } = require('../whatsapp/repository');
const now = new Date('2026-11-08T01:00:00Z');
const message = text => ({ id: 'test-message', from: '5511999990000', timestamp: String(now.getTime() / 1000), text });
function store() {
  let draft;
  const writes = [];
  return {
    writes, account: async () => ({ usuario_id: 7 }),
    draft: async () => draft,
    setDraft: async (id, transaction, code, expires_at) => { assert.equal(id, 7); draft = { transaction, code, expires_at }; },
    clearDraft: async id => { assert.equal(id, 7); draft = undefined; },
    save: async (id, transaction) => { writes.push({ id, transaction }); return 12; },
    totals: async id => { assert.equal(id, 7); return { receitas: '100.00', despesas: '25.90', saldo: '74.10' }; },
    link: async () => false,
  };
}
const options = { now, confirmationCode: () => 'abcdef123456' };

test('parses structured and simple Portuguese commands without an AI provider', () => {
  const draft = parseCommand('compra 15 reais frutas', now);
  assert.deepEqual(draft.transaction, { tipo: 'despesa', valor: '15.00', descricao: 'frutas', data: '2026-11-07', categoria: 'Alimentação', forma_pagamento: null });
  assert.equal(parseCommand('recebi R$ 500,50 trabalho | data=29/02/2024 | categoria=Freelance', now).transaction.tipo, 'receita');
  assert.equal(parseCommand('gastei 35,90 com almoço', now).transaction.descricao, 'almoço');
  assert.equal(today(now), '2026-11-07');
  assert.equal(money('-9999999999999.99'), '-R$ 9.999.999.999.999,99');
});
test('rejects ambiguous amounts, bad dates, duplicate fields and oversized messages', () => {
  for (const text of ['despesa 1.250,50 mercado', 'despesa 0 frutas', 'despesa -15 frutas', 'despesa 1,234 frutas',
    'despesa 20 frutas | data=29/02/2026', 'despesa 20 frutas | data=07/11', 'receita 20 teste | categoria=A | categoria=B',
    'despesa 20 frutas | usuario_id=9', 'x'.repeat(601)]) assert.throws(() => parseCommand(text, now));
});
test('never writes before confirmation; confirms once and preserves exact amount', async () => {
  const db = store();
  assert.match(await processMessage(db, message('despesa 15 frutas'), options), /confirmar abcdef123456/);
  assert.equal(db.writes.length, 0);
  assert.match(await processMessage(db, message('confirmar aaaaaaaaaaaa'), options), /inválida/);
  assert.equal(db.writes.length, 0);
  assert.match(await processMessage(db, message('confirmar abcdef123456'), options), /cadastrada/);
  assert.equal(db.writes[0].id, 7);
  assert.equal(db.writes[0].transaction.valor, '15.00');
  assert.match(await processMessage(db, message('confirmar abcdef123456'), options), /inválida/);
  assert.equal(db.writes.length, 1);
});
test('pending draft cannot be silently replaced; cancellation and expiry do not write', async () => {
  const db = store();
  await processMessage(db, message('despesa 15 frutas'), options);
  assert.match(await processMessage(db, message('despesa 500 teste'), options), /Já existe/);
  await processMessage(db, message('cancelar'), options);
  await processMessage(db, message('confirmar abcdef123456'), options);
  await processMessage(db, message('receita 30 teste'), options);
  const later = new Date(now.getTime() + 11 * 60000);
  await processMessage(db, { ...message('confirmar abcdef123456'), timestamp: String(later.getTime() / 1000) }, { now: later });
  assert.equal(db.writes.length, 0);
});
test('unlinked phone cannot read totals or save, and old messages cannot execute', async () => {
  const db = store(); db.account = async () => null;
  assert.match(await processMessage(db, message('resumo'), options), /Vincule/);
  assert.match(await processMessage(db, { ...message('resumo'), timestamp: '1' }, options), /antiga/);
  assert.equal(db.writes.length, 0);
});
test('summary states the all-time scope and supports negative balances', async () => {
  const db = store(); db.totals = async () => ({ receitas: '0.00', despesas: '25.90', saldo: '-25.90' });
  const reply = await processMessage(db, message('resumo'), options);
  assert.match(reply, /Todo o período/); assert.match(reply, /-R\$ 25,90/); assert.match(reply, /Não representa saldo bancário/);
});
test('webhook authenticates exact raw bytes with app secret, not the verification token', () => {
  const body = Buffer.from('{"text":"ação"}');
  const signature = 'sha256=' + createHmac('sha256', 'test-secret').update(body).digest('hex');
  assert.equal(validSignature(body, signature, 'test-secret'), true);
  assert.equal(validSignature(Buffer.from('{ "text":"ação"}'), signature, 'test-secret'), false);
  assert.equal(validSignature(body, signature, 'other'), false);
  assert.equal(validSignature(body, 'sha256=x', 'test-secret'), false);
});
test('WhatsApp is opt-in, validates configuration, and filters statuses and other numbers', () => {
  assert.equal(configuration({}), null);
  assert.throws(() => configuration({ WHATSAPP_ENABLED: 'true' }));
  assert.deepEqual(messages({ object: 'other' }, '123'), []);
  const value = { metadata: { phone_number_id: '123' }, messages: [{ ...message('resumo'), type: 'text', text: { body: 'resumo' } }] };
  const body = { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value }] }] };
  assert.equal(messages(body, '123').length, 1);
  assert.equal(messages(body, '456').length, 0);
  assert.throws(() => phone('55 11 99999-0000'));
  assert.equal(phone('+5511999990000'), '5511999990000');
});
test('sender awaits a confirmed Graph response and never accepts HTTP success without a message ID', async () => {
  let call;
  const config = { version: 'v99.0', phoneNumberId: '123', accessToken: 'isolated-test' };
  const send = createSender(config, async (url, options) => { call = { url, options }; return new Response(JSON.stringify({ messages: [{ id: 'accepted' }] })); });
  await send('5511999990000', 'Teste');
  assert.equal(call.url, 'https://graph.facebook.com/v99.0/123/messages');
  assert.equal(JSON.parse(call.options.body).text.body, 'Teste');
  await assert.rejects(createSender(config, async () => new Response('{}'))('5511999990000', 'Teste'));
});
