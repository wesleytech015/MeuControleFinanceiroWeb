// Importa a conexão com o banco de dados.
const conexao = require('../database/conexao');

/*
CORREÇÕES APLICADAS:
- Método "criar" agora inclui categoria e forma_pagamento no INSERT.
- Adicionado método "atualizar" com UPDATE no banco.
- Listagem ordenada por data mais recente primeiro.
*/

// Classe responsável pelas operações da tabela movimentacoes.
class Transacao {

  // ============================================
  // LISTAR TODAS AS MOVIMENTAÇÕES DO USUÁRIO
  // ============================================
  static async listarTodas(usuario_id) {

    // Executa a consulta no banco buscando apenas
    // as movimentações do usuário logado.
    // CORRIGIDO: ORDER BY data DESC para trazer as mais recentes primeiro.
    const [rows] = await conexao.query(
      'SELECT * FROM movimentacoes WHERE usuario_id = ? ORDER BY data DESC',
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
    // CORRIGIDO: agora inclui categoria e forma_pagamento.
    const {
      usuario_id,
      descricao,
      valor,
      tipo,
      data,
      categoria,
      forma_pagamento
    } = transacao;

    // Query SQL responsável por inserir
    // uma nova movimentação no banco.
    // CORRIGIDO: colunas categoria e forma_pagamento adicionadas.
    const sql = `
      INSERT INTO movimentacoes
      (
        usuario_id,
        descricao,
        valor,
        tipo,
        data,
        categoria,
        forma_pagamento
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // Executa a query enviando os valores.
    const [result] = await conexao.query(sql, [
      usuario_id,
      descricao,
      valor,
      tipo,
      data,
      categoria,
      forma_pagamento
    ]);

    // Retorna o resultado da inserção.
    return result;
  }

  //
  // ATUALIZAR MOVIMENTAÇÃO EXISTENTE 
  // ============================================
  // Para que serve: executa um UPDATE na tabela movimentacoes.
  // O AND usuario_id = ? impede que um usuário edite
  // uma movimentação que pertence a outro usuário.
  static async atualizar(id, usuario_id, dados) {

    // Desestrutura os novos dados enviados pelo frontend.
    const {
      descricao,
      valor,
      tipo,
      data,
      categoria,
      forma_pagamento
    } = dados;

    // Query SQL responsável por atualizar os campos
    // da movimentação no banco.
    const sql = `
      UPDATE movimentacoes
      SET
        descricao = ?,
        valor = ?,
        tipo = ?,
        data = ?,
        categoria = ?,
        forma_pagamento = ?
      WHERE id = ?
      AND usuario_id = ?
    `;

    // Executa a query enviando os valores novos e o id.
    const [result] = await conexao.query(sql, [
      descricao,
      valor,
      tipo,
      data,
      categoria,
      forma_pagamento,
      id,
      usuario_id
    ]);

    // Retorna o resultado da atualização.
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