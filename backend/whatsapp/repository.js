const { createHash, randomBytes } = require('node:crypto');
const { validateTransaction } = require('../validation/transacao');
const hash = value => createHash('sha256').update(value).digest('hex');
function phone(value) {
  if (typeof value !== 'string' || !/^\+?[1-9]\d{9,14}$/.test(value)) throw new Error('Informe o número com DDI e DDD, somente dígitos, sem espaços.');
  return value.replace(/^\+/, '');
}
function createRepository(pool, aiProvider = 'gemini') {
  if (!['gemini', 'qwen'].includes(aiProvider)) throw new Error('Provedor de IA inválido.');
  async function transaction(handler) {
    const db = await pool.connect();
    try {
      await db.query('BEGIN');
      const result = await handler(db);
      await db.query('COMMIT');
      return result;
    } catch (error) { await db.query('ROLLBACK'); throw error; }
    finally { db.release(); }
  }
  return {
    async pairing(userId, number) {
      const normalized = phone(number);
      const code = randomBytes(16).toString('hex');
      await pool.query(`INSERT INTO whatsapp_links (usuario_id, pending_phone, code_hash, code_expires) VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '10 minutes')
        ON CONFLICT (usuario_id) DO UPDATE SET pending_phone=EXCLUDED.pending_phone, code_hash=EXCLUDED.code_hash, code_expires=EXCLUDED.code_expires`, [userId, normalized, hash(code)]);
      return { codigo: code, expiraEmSegundos: 600, comando: `vincular ${code}` };
    },
    async status(userId) {
      const { rows } = await pool.query('SELECT phone FROM whatsapp_links WHERE usuario_id=$1', [userId]);
      return { vinculado: !!rows[0]?.phone, numeroMascarado: rows[0]?.phone ? `••••${rows[0].phone.slice(-4)}` : null };
    },
    async unlink(userId) {
      await transaction(async db => {
        await db.query('SELECT usuario_id FROM whatsapp_links WHERE usuario_id=$1 FOR UPDATE', [userId]);
        await db.query('DELETE FROM whatsapp_drafts WHERE usuario_id=$1', [userId]);
        await db.query('DELETE FROM whatsapp_links WHERE usuario_id=$1', [userId]);
      });
    },
    async receive(message, handler) {
      return transaction(async db => {
        const claim = await db.query('INSERT INTO whatsapp_inbox (message_id, phone) VALUES ($1, $2) ON CONFLICT (message_id) DO NOTHING', [message.id, message.from]);
        if (!claim.rowCount) return;
        const store = {
          async link(number, code) {
            const { rows } = await db.query('SELECT usuario_id FROM whatsapp_links WHERE code_hash=$1 AND pending_phone=$2 AND code_expires>CURRENT_TIMESTAMP FOR UPDATE', [hash(code), number]);
            if (!rows.length) return false;
            const { rows: existing } = await db.query('SELECT usuario_id FROM whatsapp_links WHERE phone=$1 FOR UPDATE', [number]);
            if (existing.length && existing[0].usuario_id !== rows[0].usuario_id) return false;
            await db.query('UPDATE whatsapp_links SET phone=$1, pending_phone=NULL, code_hash=NULL, code_expires=NULL WHERE usuario_id=$2', [number, rows[0].usuario_id]);
            await db.query('DELETE FROM whatsapp_drafts WHERE usuario_id=$1', [rows[0].usuario_id]);
            return true;
          },
          async account(number) {
            const { rows } = await db.query('SELECT usuario_id FROM whatsapp_links WHERE phone=$1 FOR UPDATE', [number]);
            return rows[0];
          },
          async setAiConsent(userId, enabled) {
            await db.query(`UPDATE whatsapp_links SET ai_consent_at=CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE NULL END, ai_provider=CASE WHEN $2 THEN $3 ELSE NULL END WHERE usuario_id=$1`, [userId, enabled, aiProvider]);
          },
          async aiConsent(userId) {
            const { rows } = await db.query(`SELECT ai_consent_at FROM whatsapp_links WHERE usuario_id=$1 AND ai_provider=$2`, [userId, aiProvider]);
            return !!rows[0]?.ai_consent_at;
          },
          async consumeAiBudget(userId) {
            const result = await db.query(`UPDATE whatsapp_links SET
              ai_requests=CASE WHEN ai_window_started>CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN ai_requests+1 ELSE 1 END,
              ai_window_started=CASE WHEN ai_window_started>CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN ai_window_started ELSE CURRENT_TIMESTAMP END
              WHERE usuario_id=$1 AND ai_consent_at IS NOT NULL AND ai_provider=$2 AND
              (ai_window_started IS NULL OR ai_window_started<=CURRENT_TIMESTAMP - INTERVAL '1 hour' OR ai_requests<12) RETURNING usuario_id`, [userId, aiProvider]);
            return result.rowCount === 1;
          },
          async draft(userId) {
            const { rows } = await db.query('SELECT payload, confirmation_code, expires_at FROM whatsapp_drafts WHERE usuario_id=$1', [userId]);
            const row = rows[0];
            return row && { transaction: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload, code: row.confirmation_code, expires_at: row.expires_at };
          },
          async setDraft(userId, draft, code, expiresAt) {
            await db.query('INSERT INTO whatsapp_drafts (usuario_id, payload, confirmation_code, expires_at) VALUES ($1, $2, $3, $4) ON CONFLICT (usuario_id) DO UPDATE SET payload=EXCLUDED.payload, confirmation_code=EXCLUDED.confirmation_code, expires_at=EXCLUDED.expires_at', [userId, JSON.stringify(draft), code, expiresAt]);
          },
          async clearDraft(userId) { await db.query('DELETE FROM whatsapp_drafts WHERE usuario_id=$1', [userId]); },
          async save(userId, input) {
            const value = validateTransaction(input);
            const result = await db.query('INSERT INTO movimentacoes (usuario_id, descricao, valor, tipo, data, categoria, forma_pagamento) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [userId, value.descricao, value.valor, value.tipo, value.data, value.categoria, value.forma_pagamento]);
            return result.rows[0].id;
          },
          async weeklyExpenses(userId, period) {
            const { rows } = await db.query(`SELECT CAST(COALESCE(SUM(valor),0) AS DECIMAL(30,2)) total
              FROM movimentacoes WHERE usuario_id=$1 AND tipo='despesa' AND data >= $2::date AND data < $3::date`,
            [userId, period.start, period.endExclusive]);
            return rows[0].total;
          },
          async totals(userId) {
            const { rows } = await db.query(`SELECT CAST(COALESCE(SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END),0) AS DECIMAL(30,2)) receitas,
              CAST(COALESCE(SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END),0) AS DECIMAL(30,2)) despesas,
              CAST(COALESCE(SUM(CASE WHEN tipo='receita' THEN valor ELSE -valor END),0) AS DECIMAL(30,2)) saldo FROM movimentacoes WHERE usuario_id=$1`, [userId]);
            return rows[0];
          },
        };
        const reply = await handler(store, message);
        await db.query('UPDATE whatsapp_inbox SET reply=$1 WHERE message_id=$2', [reply, message.id]);
      });
    },
    async deliver(message, send) {
      const claim = await pool.query(`UPDATE whatsapp_inbox SET sending_until=CURRENT_TIMESTAMP + INTERVAL '1 minute' WHERE message_id=$1 AND phone=$2 AND sent_at IS NULL AND reply IS NOT NULL AND received_at>CURRENT_TIMESTAMP - INTERVAL '15 minutes' AND (sending_until IS NULL OR sending_until<CURRENT_TIMESTAMP)`, [message.id, message.from]);
      if (!claim.rowCount) return;
      try {
        const { rows } = await pool.query('SELECT reply FROM whatsapp_inbox WHERE message_id=$1 AND phone=$2', [message.id, message.from]);
        await send(message.from, rows[0].reply);
        await pool.query('UPDATE whatsapp_inbox SET sent_at=CURRENT_TIMESTAMP, sending_until=NULL WHERE message_id=$1', [message.id]);
      } catch (error) {
        await pool.query('UPDATE whatsapp_inbox SET sending_until=NULL WHERE message_id=$1', [message.id]);
        throw error;
      }
    },
  };
}
module.exports = { createRepository, phone, hash };
