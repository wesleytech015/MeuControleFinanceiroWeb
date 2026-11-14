const pool = require('../database/conexao');

async function getAuthVersion(usuarioId, executor = pool) {
  const { rows } = await executor.query(`SELECT COALESCE(v.versao, 0) AS auth_version
    FROM usuarios u LEFT JOIN autenticacao_versoes v ON v.usuario_id = u.id WHERE u.id = $1`, [usuarioId]);
  return rows[0]?.auth_version ?? null;
}

async function revokeSessions(client, usuarioId) {
  await client.query(`INSERT INTO autenticacao_versoes (usuario_id, versao) VALUES ($1, 1)
    ON CONFLICT (usuario_id) DO UPDATE SET versao = autenticacao_versoes.versao + 1`, [usuarioId]);
}

module.exports = { getAuthVersion, revokeSessions };
