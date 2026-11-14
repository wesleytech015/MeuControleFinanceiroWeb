const pool = require('../database/conexao');

async function transaction(work) {
  const client = await pool.connect();
  let destroy = false;
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '3s'");
    await client.query("SET LOCAL statement_timeout = '5s'");
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { destroy = true; }
    throw error;
  } finally {
    client.release(destroy);
  }
}

async function saveSecret(client, usuarioId, hash) {
  await client.query(`INSERT INTO recuperacao_seguranca (usuario_id, palavra_hash)
    VALUES ($1, $2) ON CONFLICT (usuario_id) DO UPDATE
    SET palavra_hash = EXCLUDED.palavra_hash, tentativas = 0, inicio_janela = NULL, bloqueado_ate = NULL,
    atualizado_em = CURRENT_TIMESTAMP`, [usuarioId, hash]);
}

module.exports = { transaction, saveSecret };
