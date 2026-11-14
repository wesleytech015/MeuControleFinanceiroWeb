const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const { transaction, saveSecret } = require('../models/recuperacao');
const { hashSecret, compareSecret } = require('../services/recoverySecret');
const { getAuthVersion, revokeSessions } = require('../models/authVersion');
const { recoveryWindow, failedAttempt } = require('../services/recoveryWindow');
const dummyHash = bcrypt.hashSync(crypto.randomBytes(32).toString('base64'), 10);
const invalid = res => res.status(400).json({ erro: 'Não foi possível redefinir a senha. Confira os dados ou tente novamente mais tarde.', codigo: 'RECOVERY_INVALID' });

exports.configurar = async (req, res) => {
  try {
    const hash = await hashSecret(req.body.palavraChave);
    const updated = await transaction(async client => {
      const { rows } = await client.query('SELECT id, senha FROM usuarios WHERE id = $1 FOR UPDATE', [req.usuario.id]);
      const user = rows[0];
      if (user && await getAuthVersion(user.id, client) !== (req.usuario.sv ?? 0)) return 'revoked';
      const matches = await bcrypt.compare(req.body.senhaAtual, user?.senha || dummyHash);
      if (!user || !matches) return false;
      await saveSecret(client, user.id, hash);
      return true;
    });
    if (updated === 'revoked') return res.status(401).json({ erro: 'Sua sessão expirou. Entre novamente.' });
    if (!updated) return res.status(400).json({ erro: 'A senha atual está incorreta.', codigo: 'CURRENT_PASSWORD_INVALID' });
    res.set('Cache-Control', 'no-store').json({ mensagem: 'Palavra-chave de recuperação atualizada.' });
  } catch {
    res.status(500).json({ erro: 'Não foi possível configurar a recuperação agora.' });
  }
};

exports.redefinir = async (req, res) => {
  try {
    const updated = await transaction(async client => {
      // Mesma ordem de bloqueios usada na configuração: usuário, depois recuperação.
      const { rows: users } = await client.query('SELECT id FROM usuarios WHERE email = $1 FOR UPDATE', [req.body.email]);
      const user = users[0];
      const { rows } = user ? await client.query(`SELECT palavra_hash, tentativas, inicio_janela, bloqueado_ate
        FROM recuperacao_seguranca
        WHERE usuario_id = $1 FOR UPDATE`, [user.id]) : { rows: [] };
      const record = rows[0];
      const { rows: clock } = await client.query('SELECT clock_timestamp() AS agora');
      const now = new Date(clock[0].agora);
      const state = record && recoveryWindow(record, now);
      const matches = await compareSecret(req.body.palavraChave, record?.palavra_hash || dummyHash);
      if (!user || !record || state.blocked) return false;
      if (!matches) {
        const failure = failedAttempt(state, now);
        await client.query(`UPDATE recuperacao_seguranca SET tentativas = $1, inicio_janela = $2,
          bloqueado_ate = $3 WHERE usuario_id = $4`, [failure.attempts, failure.startedAt, failure.blockedUntil, user.id]);
        return false;
      }
      const hash = await bcrypt.hash(req.body.novaSenha, 10);
      await client.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [hash, user.id]);
      await revokeSessions(client, user.id);
      await client.query('UPDATE recuperacao_seguranca SET tentativas = 0, inicio_janela = NULL, bloqueado_ate = NULL WHERE usuario_id = $1', [user.id]);
      return true;
    });
    if (!updated) return invalid(res);
    res.set('Cache-Control', 'no-store').json({ mensagem: 'Senha redefinida. Entre com sua nova senha.' });
  } catch {
    res.status(500).json({ erro: 'Não foi possível redefinir a senha agora. Tente novamente em instantes.' });
  }
};
