const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRepository } = require('../whatsapp/repository');

function fixture(rowCount) {
  const events = [];
  const connection = {

    query: async sql => { if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)) { events.push(sql.toLowerCase()); return; } events.push('claim'); return { rowCount, rows: [] }; },
     release: () => events.push('release'),
  };
  return { events, repository: createRepository({ connect: async () => connection }) };
}
test('persisted duplicate does not invoke the financial processor', async () => {
  const { events, repository } = fixture(0);
  await repository.receive({ id: 'duplicate', from: '5511999990000' }, async () => { throw Error('Duplicate must not run'); });
  assert.deepEqual(events, ['begin', 'claim', 'commit', 'release']);
});
test('failed financial processor rolls back its inbox claim and always releases connection', async () => {
  const { events, repository } = fixture(1);
  await assert.rejects(repository.receive({ id: 'new', from: '5511999990000' }, async () => { throw Error('transaction failed'); }), /transaction failed/);
  assert.deepEqual(events, ['begin', 'claim', 'rollback', 'release']);
});
