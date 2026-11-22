const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const isolated = require('./helpers/isolatedPostgres.cjs');
const { createRepository } = require('../whatsapp/repository');
const { createAssistant } = require('../assistant/service');
const { processMessage } = require('../whatsapp/processor');

test('PostgreSQL: conversation survives restart, is bounded and isolated; corrected WhatsApp entry uses the linked account',
  { skip: !isolated.available(), timeout: 60000 }, async () => {
    const instance = await isolated.start();
    const pool = instance.pool;
    try {
      for (const file of ['schema.postgresql.sql', 'migrations/20261109_whatsapp.postgresql.sql', 'migrations/20261114_whatsapp_ia.postgresql.sql', 'migrations/20261118_whatsapp_context.postgresql.sql']) {
        await pool.query(fs.readFileSync(path.join(__dirname, '../database', file), 'utf8'));
      }
      // Applying the additive migration twice is safe in the disposable database.
      await pool.query(fs.readFileSync(path.join(__dirname, '../database/migrations/20261118_whatsapp_context.postgresql.sql'), 'utf8'));
      const ids = [];
      for (let i = 0; i < 2; i++) ids.push((await pool.query('INSERT INTO usuarios(nome,email,senha) VALUES($1,$2,$3) RETURNING id', ['Context test', `context-${i}@example.invalid`, 'unused-fixture'])).rows[0].id);
      const phones = ['5511999990000', '5511999990001'];
      let repository = createRepository(pool), counter = 0;
      const seen = [];
      const assistant = createAssistant(async ({ input }) => {
        seen.push(input);
        if (input.mensagem === '350') {
          assert.ok(input.historico.some(item => item.text === 'paguei um pneu'));
          assert.ok(input.historico.length <= 5);
          return { kind: 'draft', transacao: { descricao: 'pneu', valor: '350.00', tipo: 'despesa', data: input.hoje, categoria: 'Transporte' } };
        }
        if (input.mensagem === 'foi ontem') {
          assert.equal(input.propostaPendente.valor, '350.00');
          const yesterday = new Date(input.hoje + 'T00:00:00Z'); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
          return { kind: 'draft', transacao: { ...input.propostaPendente, data: yesterday.toISOString().slice(0, 10) } };
        }
        return { kind: 'clarify' };
      });
      async function send(i, text, id = randomBytes(12).toString('hex')) {
        const message = { id, from: phones[i], text, timestamp: String(Math.floor(Date.now() / 1000)) };
        let reply;
        await repository.receive(message, async (store, value) => {
          reply = await processMessage(store, value, { assistant, confirmationCode: () => (++counter).toString(16).padStart(12, '0') });
          return reply;
        });
        return reply;
      }
      async function history(i, id = ids[i]) {
        let result;
        await repository.receive({ id: randomBytes(12).toString('hex'), from: phones[i] }, async store => { result = await store.recentConversation(id); return 'fixture'; });
        return result;
      }
      for (let i = 0; i < 2; i++) {
        const pairing = await repository.pairing(ids[i], phones[i]);
        assert.match(await send(i, pairing.comando), /vinculado/);
        await send(i, 'ia ativar');
      }
      await send(0, 'paguei um pneu');
      await send(1, 'paguei almoço');
      assert.ok((await history(0)).some(item => item.text === 'paguei um pneu'));
      assert.ok(!(await history(1)).some(item => item.text === 'paguei um pneu'));
      assert.deepEqual(await history(0, ids[1]), []);
      repository = createRepository(pool); // No in-process memory is required.
      const proposal = await send(0, '350', 'one-proposal');
      const oldCode = /confirmar ([a-f0-9]{12})/.exec(proposal)[1];
      assert.equal(await send(0, '350', 'one-proposal'), undefined);
      assert.equal((await pool.query('SELECT count(*) FROM movimentacoes')).rows[0].count, '0');
      assert.doesNotMatch(JSON.stringify(await history(0)), new RegExp(oldCode));
      const corrected = await send(0, 'foi ontem');
      assert.match(corrected, /código anterior não é mais válido/);
      const newCode = /confirmar ([a-f0-9]{12})/.exec(corrected)[1];
      assert.notEqual(oldCode, newCode);
      await send(0, 'confirmar ' + oldCode);
      assert.equal((await pool.query('SELECT count(*) FROM movimentacoes')).rows[0].count, '0');
      await send(0, 'confirmar ' + newCode, 'confirmed-once');
      await send(0, 'confirmar ' + newCode, 'confirmed-once');
      const records = (await pool.query('SELECT usuario_id,valor::text,descricao FROM movimentacoes')).rows;
      assert.deepEqual(records, [{ usuario_id: ids[0], valor: '350.00', descricao: 'pneu' }]);
      assert.deepEqual(await history(0), []);
      for (let i = 0; i < 6; i++) await send(1, 'paguei almoço ' + i);
      assert.equal((await history(1)).length, 5);
      await pool.query("UPDATE whatsapp_links SET conversation_updated_at=CURRENT_TIMESTAMP - INTERVAL '16 minutes' WHERE usuario_id=$1", [ids[1]]);
      assert.deepEqual(await history(1), []);
      await send(1, 'paguei almoço');
      await send(1, 'ia desativar');
      assert.deepEqual((await pool.query('SELECT conversation FROM whatsapp_links WHERE usuario_id=$1', [ids[1]])).rows[0].conversation, []);
      await repository.unlink(ids[0]);
      assert.equal((await pool.query('SELECT count(*) FROM movimentacoes')).rows[0].count, '1');
      assert.deepEqual(await history(0), []);
      assert.ok(seen.every(input => input.historico.length <= 5));
    } finally { await instance.stop(); }
  });
