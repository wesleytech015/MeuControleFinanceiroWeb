const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseCommand, currentWeek } = require('../whatsapp/commands');
const { processMessage } = require('../whatsapp/processor');
const { createRepository } = require('../whatsapp/repository');

test('weekly questions resolve Monday through today in Sao Paulo, including timezone/year boundaries', () => {
  const sunday = new Date('2026-11-16T02:59:59Z');
  assert.deepEqual(currentWeek(sunday), { start: '2026-11-09', through: '2026-11-15', endExclusive: '2026-11-16' });
  assert.deepEqual(currentWeek(new Date('2026-11-16T03:00:00Z')), { start: '2026-11-16', through: '2026-11-16', endExclusive: '2026-11-17' });
  assert.deepEqual(currentWeek(new Date('2027-01-01T15:00:00Z')), { start: '2026-12-28', through: '2027-01-01', endExclusive: '2027-01-02' });
  for (const text of ['quanto eu gastei essa semana?', 'Quanto gastei nesta semana?', 'Gastos da semana', 'meus gastos desta semana!']) {
    assert.equal(parseCommand(text, sunday).kind, 'weekly_expenses');
  }
  for (const text of ['quanto gastei essa semana em mercado?', 'quanto outra pessoa gastou essa semana?', 'quanto gastei semana passada?']) assert.throws(() => parseCommand(text, sunday));
});

test('weekly query uses only the linked account, never calls Gemini and preserves pending drafts', async () => {
  const now = new Date('2026-11-15T15:00:00Z');
  const message = { from: '5511999990000', text: 'quanto eu gastei essa semana?', timestamp: String(now.getTime() / 1000) };
  let queried = 0;
  const store = { account: async () => ({ usuario_id: 7 }), weeklyExpenses: async (id, period) => {
    queried++; assert.equal(id, 7); assert.equal(period.start, '2026-11-09'); return '1234.56';
  }, draft: async () => { throw Error('Must not touch drafts'); }, save: async () => { throw Error('Must not write'); } };
  const options = { now, assistant: async () => { throw Error('Must not call provider'); } };
  assert.match(await processMessage(store, message, options), /R\$ 1\.234,56.*09\/11\/2026 a 15\/11\/2026/);
  assert.equal(queried, 1);
  store.weeklyExpenses = async () => '0.00';
  assert.match(await processMessage(store, message, options), /R\$ 0,00/);
  store.weeklyExpenses = async () => { throw Error('database unavailable'); };
  await assert.rejects(processMessage(store, message, options), /database unavailable/);
  store.account = async () => null;
  assert.match(await processMessage(store, message, options), /Vincule/);
});

test('weekly SQL is fixed, parameterized and filters ownership, expenses and exclusive date bounds', async () => {
  const queries = [];
  const db = { release() {}, query: async (sql, args) => {
    queries.push({ sql, args });
    return /SUM\(valor\)/.test(sql) ? { rows: [{ total: '25.90' }] } : { rowCount: 1, rows: [] };
  } };
  await createRepository({ connect: async () => db }).receive({ id: 'weekly-fixture', from: '5511999990000' }, async store => {
    assert.equal(await store.weeklyExpenses(7, { start: '2026-11-09', endExclusive: '2026-11-16' }), '25.90');
  });
  const query = queries.find(({ sql }) => /SUM\(valor\)/.test(sql));
  assert.match(query.sql, /usuario_id=\$1 AND tipo='despesa' AND data >= \$2::date AND data < \$3::date/);
  assert.deepEqual(query.args, [7, '2026-11-09', '2026-11-16']);
});
