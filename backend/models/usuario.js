const conexao = require('../database/conexao');

class Usuario {
    static async criar(usuario) {
        const { nome, email, senha } = usuario;
        const sql = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
        const [result] = await conexao.query(sql, [nome, email, senha]);
        return result;
    }

    static async listarDoUsuario(usuarioId) {
        const [rows] = await conexao.query('SELECT id, nome, email, criado_em FROM usuarios WHERE id = ?', [usuarioId]);
        return rows;
    }

    static async buscarPorEmail(email) {
  const [rows] = await conexao.query(
    'SELECT * FROM usuarios WHERE email = ?',
    [email]
  );

  return rows[0];
}

}

module.exports = Usuario;
