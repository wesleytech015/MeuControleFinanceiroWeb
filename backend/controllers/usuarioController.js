const Usuario = require('../models/usuario');
const bcrypt = require('bcrypt');


const usuarioController = {
    criar: async (req, res) => {
        try {
           const { nome, email, senha } = req.body;

if (!nome || !email || !senha) {
  return res.status(400).json({ erro: 'Dados obrigatórios' });
}

const senhaCriptografada = await bcrypt.hash(senha, 10);

            if (!nome || !email || !senha) {
                return res.status(400).json({ erro: 'Dados obrigatórios' });
            }

           const result = await Usuario.criar({
      nome,
      email,
      senha: senhaCriptografada
    });

            res.status(201).json({
                mensagem: 'Usuário cadastrado com sucesso!',
                id: result.insertId
            });
        } catch (err) {
            console.error('Erro ao cadastrar usuário:', err);
            res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
        }
    },

    listar: async (req, res) => {
        try {
            const usuarios = await Usuario.listarTodos();
            res.json(usuarios);
        } catch (err) {
            console.error('Erro ao listar usuários:', err);
            res.status(500).json({ erro: 'Erro ao listar usuários' });
        }
    }
};

module.exports = usuarioController;
