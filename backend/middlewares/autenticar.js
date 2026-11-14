// * pegar o token do header Authorization
// * verificar se o token existe
// * validar com jsonwebtoken
// * colocar os dados do usuário em req.usuario
// * chamar next() /*

const jwt = require('jsonwebtoken');
const segredo = require('../config/jwt');
const { getAuthVersion } = require('../models/authVersion');

const autenticar = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        erro: 'Token não fornecido'
      });
    }

    const partes = authHeader.split(' ');

    if (partes.length !== 2) {
      return res.status(401).json({
        erro: 'Token mal formatado'
      });
    }

    const [tipo, token] = partes;

    if (tipo !== 'Bearer') {
      return res.status(401).json({
        erro: 'Tipo de token inválido'
      });
    }

    const payload = jwt.verify(token, segredo, { algorithms: ['HS256'] });
    if (!payload || !Number.isSafeInteger(payload.id) || payload.id <= 0) {
      return res.status(401).json({ erro: 'Token inválido' });
    }

    const version = payload.sv ?? 0;
    if (!Number.isSafeInteger(version) || version < 0) return res.status(401).json({ erro: 'Token inválido' });
    let currentVersion;
    try { currentVersion = await getAuthVersion(payload.id); } catch {
      return res.status(503).json({ erro: 'Não foi possível validar a sessão agora. Tente novamente.' });
    }
    if (currentVersion === null || currentVersion !== version) return res.status(401).json({ erro: 'Sua sessão expirou. Entre novamente.' });
    req.usuario = { ...payload, sv: version };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        erro: 'Token expirado'
      });
    }

    return res.status(401).json({
      erro: 'Token inválido'
    });
  }
};

module.exports = autenticar;
