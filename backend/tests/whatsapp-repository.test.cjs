const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRepository } = require('../whatsapp/repository');

function fixture(affectedRows) {
  const events = [];
  const connection = {
    beginTransaction: async () => events.push('begin'),
    execute: async () => { events.push('claim'); return [{ affectedRows }]; },
    commit: async () => events.push('commit'), rollback: async () => events.push('rollback'), release: () => events.push('release'),
  };
  return { events, repository: createRepository({ getConnection: async () => connection }) };
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
