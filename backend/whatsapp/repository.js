const { createHash, randomBytes } = require('node:crypto');
const { validateTransaction } = require('../validation/transacao');
const hash = value => createHash('sha256').update(value).digest('hex');
function phone(value) {
  if (typeof value !== 'string' || !/^\+?[1-9]\d{9,14}$/.test(value)) throw new Error('Informe o número com DDI e DDD, somente dígitos, sem espaços.');
  return value.replace(/^\+/, '');
}
function createRepository(pool) {
  async function transaction(handler) {
    const db = await pool.getConnection();
    try {
      await db.beginTransaction();
      const result = await handler(db);
      await db.commit();
      return result;
    } catch (error) { await db.rollback(); throw error; }
    finally { db.release(); }
  }
  return {
    async pairing(userId, number) {
      const normalized = phone(number);
      const code = randomBytes(16).toString('hex');
      await pool.execute(`INSERT INTO whatsapp_links (usuario_id, pending_phone, code_hash, code_expires) VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 10 MINUTE))
        ON DUPLICATE KEY UPDATE pending_phone=VALUES(pending_phone), code_hash=VALUES(code_hash), code_expires=VALUES(code_expires)`, [userId, normalized, hash(code)]);
      return { codigo: code, expiraEmSegundos: 600, comando: `vincular ${code}` };
    },
    async status(userId) {
      const [rows] = await pool.execute('SELECT phone FROM whatsapp_links WHERE usuario_id=?', [userId]);
      return { vinculado: !!rows[0]?.phone, numeroMascarado: rows[0]?.phone ? `••••${rows[0].phone.slice(-4)}` : null };
    },
    async unlink(userId) {
      await transaction(async db => {
        await db.execute('SELECT usuario_id FROM whatsapp_links WHERE usuario_id=? FOR UPDATE', [userId]);
        await db.execute('DELETE FROM whatsapp_drafts WHERE usuario_id=?', [userId]);
        await db.execute('DELETE FROM whatsapp_links WHERE usuario_id=?', [userId]);
      });
    },
    async receive(message, handler) {
      return transaction(async db => {
        const [claim] = await db.execute('INSERT IGNORE INTO whatsapp_inbox (message_id, phone) VALUES (?, ?)', [message.id, message.from]);
        if (!claim.affectedRows) return;
        const store = {
          async link(number, code) {
            const [rows] = await db.execute('SELECT usuario_id FROM whatsapp_links WHERE code_hash=? AND pending_phone=? AND code_expires>UTC_TIMESTAMP(3) FOR UPDATE', [hash(code), number]);
            if (!rows.length) return false;
            const [existing] = await db.execute('SELECT usuario_id FROM whatsapp_links WHERE phone=? FOR UPDATE', [number]);
            if (existing.length && existing[0].usuario_id !== rows[0].usuario_id) return false;
            await db.execute('UPDATE whatsapp_links SET phone=?, pending_phone=NULL, code_hash=NULL, code_expires=NULL WHERE usuario_id=?', [number, rows[0].usuario_id]);
            await db.execute('DELETE FROM whatsapp_drafts WHERE usuario_id=?', [rows[0].usuario_id]);
            return true;
          },
          async account(number) {
            const [rows] = await db.execute('SELECT usuario_id FROM whatsapp_links WHERE phone=? FOR UPDATE', [number]);
            return rows[0];
          },
          async draft(userId) {
            const [rows] = await db.execute('SELECT payload, confirmation_code, expires_at FROM whatsapp_drafts WHERE usuario_id=?', [userId]);
            const row = rows[0];
            return row && { transaction: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload, code: row.confirmation_code, expires_at: row.expires_at };
          },
          async setDraft(userId, draft, code, expiresAt) {
            await db.execute('INSERT INTO whatsapp_drafts (usuario_id, payload, confirmation_code, expires_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE payload=VALUES(payload), confirmation_code=VALUES(confirmation_code), expires_at=VALUES(expires_at)', [userId, JSON.stringify(draft), code, expiresAt]);
          },
          async clearDraft(userId) { await db.execute('DELETE FROM whatsapp_drafts WHERE usuario_id=?', [userId]); },
          async save(userId, input) {
            const value = validateTransaction(input);
            const [result] = await db.execute('INSERT INTO movimentacoes (usuario_id, descricao, valor, tipo, data, categoria, forma_pagamento) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, value.descricao, value.valor, value.tipo, value.data, value.categoria, value.forma_pagamento]);
            return result.insertId;
          },
          async totals(userId) {
            const [rows] = await db.execute(`SELECT CAST(COALESCE(SUM(IF(tipo='receita', valor, 0)),0) AS DECIMAL(30,2)) receitas,
              CAST(COALESCE(SUM(IF(tipo='despesa', valor, 0)),0) AS DECIMAL(30,2)) despesas,
              CAST(COALESCE(SUM(IF(tipo='receita', valor, -valor)),0) AS DECIMAL(30,2)) saldo FROM movimentacoes WHERE usuario_id=?`, [userId]);
            return rows[0];
          },
        };
        const reply = await handler(store, message);
        await db.execute('UPDATE whatsapp_inbox SET reply=? WHERE message_id=?', [reply, message.id]);
      });
    },
    async deliver(message, send) {
      const [claim] = await pool.execute('UPDATE whatsapp_inbox SET sending_until=DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 1 MINUTE) WHERE message_id=? AND phone=? AND sent_at IS NULL AND reply IS NOT NULL AND received_at>DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE) AND (sending_until IS NULL OR sending_until<UTC_TIMESTAMP(3))', [message.id, message.from]);
      if (!claim.affectedRows) return;
      try {
        const [rows] = await pool.execute('SELECT reply FROM whatsapp_inbox WHERE message_id=? AND phone=?', [message.id, message.from]);
        await send(message.from, rows[0].reply);
        await pool.execute('UPDATE whatsapp_inbox SET sent_at=UTC_TIMESTAMP(3), sending_until=NULL WHERE message_id=?', [message.id]);
      } catch (error) {
        await pool.execute('UPDATE whatsapp_inbox SET sending_until=NULL WHERE message_id=?', [message.id]);
        throw error;
      }
    },
  };
}
module.exports = { createRepository, phone, hash };
