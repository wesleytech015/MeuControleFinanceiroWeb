const Usuario = require('../models/usuario');
const bcrypt = require('bcrypt');
 
 
const usuarioController = {
 
    // ============================================
    // CRIAR NOVO USUÁRIO
    // ============================================
    criar: async (req, res) => {
        try {
            const { nome, email, senha } = req.body;
 
        
            if (!nome || !email || !senha) {
                return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios' });
            }
 
            // CRIPTOGRAFA A SENHA ANTES DE SALVAR NO BANCO
            const senhaCriptografada = await bcrypt.hash(senha, 10);
 
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
 
            // CORRIGIDO: trata e-mail duplicado (código MySQL 1062)
            // antes retornava erro 500 genérico para qualquer erro
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ erro: 'Este e-mail já está cadastrado' });
            }
 
            res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
        }
    },
 
    // ============================================
    // LISTAR TODOS OS USUÁRIOS
    // ============================================
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
 