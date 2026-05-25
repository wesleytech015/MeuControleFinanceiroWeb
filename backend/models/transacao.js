// Importa a conexão com o banco de dados.
const conexao = require('../database/conexao');

// Classe responsável pelas operações da tabela movimentacoes.
class Transacao {

  // ============================================
  // LISTAR TODAS AS MOVIMENTAÇÕES DO USUÁRIO
  // ============================================
  static async listarTodas(usuario_id) {

    // Executa a consulta no banco buscando apenas
    // as movimentações do usuário logado.
    const [rows] = await conexao.query(
      'SELECT * FROM movimentacoes WHERE usuario_id = ?',
      [usuario_id]
    );

    // Retorna os dados encontrados.
    return rows;
  }

  // ============================================
  // CRIAR NOVA MOVIMENTAÇÃO
  // ============================================
  static async criar(transacao) {

    // Desestrutura os dados recebidos do frontend.
    const {
      usuario_id,
      descricao,
      valor,
      tipo,
      data
    } = transacao;

    // Query SQL responsável por inserir
    // uma nova movimentação no banco.
    const sql = `
      INSERT INTO movimentacoes
      (
        usuario_id,
        descricao,
        valor,
        tipo,
        data
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    // Executa a query enviando os valores.
    const [result] = await conexao.query(sql, [
      usuario_id,
      descricao,
      valor,
      tipo,
      data
    ]);

    // Retorna o resultado da inserção.
    return result;
  }

  // ============================================
  // DELETAR MOVIMENTAÇÃO
  // ============================================
  static async deletar(id, usuario_id) {

    // Remove a movimentação apenas se ela
    // pertencer ao usuário autenticado.
    const [result] = await conexao.query(
      `
      DELETE FROM movimentacoes
      WHERE id = ?
      AND usuario_id = ?
      `,
      [id, usuario_id]
    );

    // Retorna o resultado da exclusão.
    return result;
  }
}

// Exporta a classe para ser utilizada nas rotas.
module.exports = Transacao;