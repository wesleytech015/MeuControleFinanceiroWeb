const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const segredo = require('../config/jwt');
const { transaction } = require('../models/recuperacao');
const { getAuthVersion } = require('../models/authVersion');

const loginController = {
  login: async (req, res) => {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
      // Login, configuração e redefinição bloqueiam primeiro a mesma linha de usuário.
      const result = await transaction(async client => {
        const { rows } = await client.query('SELECT id, nome, email, senha FROM usuarios WHERE email = $1 FOR UPDATE', [email]);
        const usuario = rows[0];
        if (!usuario || !await bcrypt.compare(senha, usuario.senha)) return null;
        const version = await getAuthVersion(usuario.id, client);
        if (version === null) return null;
        const token = jwt.sign({ id: usuario.id, nome: usuario.nome, email: usuario.email, sv: version }, segredo, { expiresIn: '24h' });
        return { token, usuario };
      });
      if (!result) return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
      res.json({
        mensagem: 'Login realizado com sucesso',
        token: result.token,
        usuario: { id: result.usuario.id, nome: result.usuario.nome, email: result.usuario.email }
      });
    } catch {
      console.error('Erro ao fazer login.');
      res.status(500).json({ erro: 'Erro ao fazer login' });
    }
  }
};
module.exports = loginController;
