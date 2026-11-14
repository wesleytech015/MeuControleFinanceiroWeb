const crypto = require('node:crypto');
const { ipKeyGenerator } = require('express-rate-limit');
const pool = require('../database/conexao');
const secret = require('../config/jwt');

function persistentLimit(scope, max, identity) {
  return async (req, res, next) => {
    try {
      const value = identity(req);
      if (typeof value !== 'string' || !value) throw new Error('Missing limiter identity');
      // Não armazena IP ou e-mail puro; contexto separado da assinatura JWT.
      const key = crypto.createHmac('sha256', secret).update(`rate-limit:v1\0${scope}\0${value}`).digest('hex');
      const { rows } = await pool.query(`INSERT INTO seguranca_limites (escopo, chave_hash, tentativas, expira_em)
        VALUES ($1, $2, 1, clock_timestamp() + INTERVAL '15 minutes')
        ON CONFLICT (escopo, chave_hash) DO UPDATE SET (tentativas, expira_em) =
        (SELECT CASE WHEN seguranca_limites.expira_em <= instante.agora THEN 1
            ELSE LEAST(seguranca_limites.tentativas + 1, 1000000) END,
          CASE WHEN seguranca_limites.expira_em <= instante.agora THEN instante.agora + INTERVAL '15 minutes'
            ELSE seguranca_limites.expira_em END
          FROM (SELECT clock_timestamp() AS agora OFFSET 0) instante)
        RETURNING tentativas, expira_em, clock_timestamp() AS agora`, [scope, key]);
      const record = rows[0];
      if (!record) throw new Error('Missing limiter result');
      if (record.tentativas > max) {
        const seconds = Math.max(1, Math.ceil((new Date(record.expira_em) - new Date(record.agora)) / 1000));
        return res.status(429).set('Retry-After', String(seconds)).set('Cache-Control', 'no-store')
          .json({ erro: 'Muitas tentativas. Aguarde antes de tentar novamente.' });
      }
      next();
    } catch {
      return res.status(503).set('Cache-Control', 'no-store').json({ erro: 'Não foi possível concluir a operação agora. Tente novamente mais tarde.' });
    }
  };
}

const ip = req => ipKeyGenerator(req.ip || req.socket.remoteAddress, 56);
module.exports = {
  recoveryIp: persistentLimit('recuperacao-ip', 10, ip),
  recoveryAccount: persistentLimit('recuperacao-conta', 10, req => req.body.email.trim()),
  settingsIp: persistentLimit('configuracao-ip', 5, ip),
  settingsUser: persistentLimit('configuracao-usuario', 5, req => String(req.usuario.id)),
  persistentLimit,
};
