// * pegar o token do header Authorization
// * verificar se o token existe
// * validar com jsonwebtoken
// * colocar os dados do usuário em req.usuario
// * chamar next() /*  

const jwt = require('jsonwebtoken');

const autenticar = (req, res, next) => {
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

    const segredo = process.env.JWT_SECRET || 'aula-senai-seguranca-web';

    const payload = jwt.verify(token, segredo);

    req.usuario = payload;

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