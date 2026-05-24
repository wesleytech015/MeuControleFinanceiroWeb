const conexao = require('../database/conexao');

class Transacao {
    // listarTodas
static async listarTodas(usuario_id) {
  const [rows] = await conexao.query(
    'SELECT * FROM movimentacoes WHERE usuario_id = ?', [usuario_id]
  );
  return rows;
}

   static async criar(transacao) {
  const { usuario_id, descricao, valor, tipo, data } = transacao;

  const sql = `
    INSERT INTO movimentacoes (usuario_id, descricao, valor, tipo, data)
    VALUES (?, ?, ?, ?, ?)
  `;

  const [result] = await conexao.query(sql, [
    usuario_id,
    descricao,
    valor,
    tipo,
    data
  ]);

  return result;
}

    // deletar
static async deletar(id, usuario_id) {
  const [result] = await conexao.query(
    'DELETE FROM movimentacoes WHERE id = ? AND usuario_id = ?', [id, usuario_id]
  );
  return result;
}
}

module.exports = Transacao;
