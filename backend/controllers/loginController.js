const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');

const loginController = {
  login: async (req, res) => {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({
          erro: 'E-mail e senha são obrigatórios'
        });
      }

      const usuario = await Usuario.buscarPorEmail(email);

      if (!usuario) {
        return res.status(401).json({
          erro: 'E-mail ou senha incorretos'
        });
      }

      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

      if (!senhaCorreta) {
        return res.status(401).json({
          erro: 'E-mail ou senha incorretos'
        });
      }

      const segredo = process.env.JWT_SECRET || 'aula-senai-seguranca-web';

      const token = jwt.sign(
        {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email
        },
        segredo,
        {
          expiresIn: '24h'
        }
      );

      res.json({
        mensagem: 'Login realizado com sucesso',
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email
        }
      });
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      res.status(500).json({
        erro: 'Erro ao fazer login'
      });
    }
  }
};

module.exports = loginController;