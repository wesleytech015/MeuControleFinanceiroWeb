/*
O que vai ter: Arquivos como TransacaoController.js.

Para que serve: Quando o Front-end pedir para salvar uma despesa, o Controller é quem vai validar se o valor não é negativo,
se a descrição foi preenchida, e depois mandar o Model salvar no banco. Ele também será responsável por calcular o saldo
total (somando receitas e subtraindo despesas) antes de enviar para a tela de Dashboard.
*/
const Transacao = require('../models/transacao');
 
const transacaoController = {
 
  // ============================================
  // LISTAR TODAS AS TRANSAÇÕES DO USUÁRIO
  // ============================================
  listar: async (req, res) => {
    try {
      const usuario_id = req.usuario.id;
 
      const resultados = await Transacao.listarTodas(usuario_id);
 
      // CALCULA SALDO TOTAL
      const saldo = resultados.reduce((acumulador, transacao) => {
        const valor = Number(transacao.valor);
 
        return transacao.tipo === 'receita'
          ? acumulador + valor
          : acumulador - valor;
      }, 0);
 
      // SOMA APENAS RECEITAS
      const receitas = resultados
        .filter((transacao) => transacao.tipo === 'receita')
        .reduce((total, transacao) => total + Number(transacao.valor), 0);
 
      // SOMA APENAS DESPESAS
      const despesas = resultados
        .filter((transacao) => transacao.tipo === 'despesa')
        .reduce((total, transacao) => total + Number(transacao.valor), 0);
 
      res.json({
        saldo,
        receitas,
        despesas,
        transacoes: resultados
      });
    } catch (erro) {
      console.error('Erro ao buscar dados:', erro);
      res.status(500).json({ erro: 'Erro ao buscar dados' });
    }
  },
 
  // ============================================
  // CRIAR NOVA TRANSAÇÃO
  // ============================================
  criar: async (req, res) => {
    try {
      const usuario_id = req.usuario.id;
 
      // CORRIGIDO: agora inclui categoria e forma_pagamento
      const { descricao, valor, tipo, data, categoria, forma_pagamento } = req.body;
 
      // VALIDA CAMPOS OBRIGATÓRIOS
      if (!descricao) {
        return res.status(400).json({ erro: 'O campo descricao é obrigatorio' });
      }
 
      if (valor == null || isNaN(Number(valor)) || Number(valor) <= 0) {
        return res.status(400).json({ erro: 'O campo valor é obrigatorio e deve ser maior que zero' });
      }
 
      if (!tipo) {
        return res.status(400).json({ erro: 'O campo tipo é obrigatorio' });
      }
 
      // VALIDA SE TIPO É RECEITA OU DESPESA (MINÚSCULO)
      if (tipo !== 'receita' && tipo !== 'despesa') {
        return res.status(400).json({
          erro: 'Tipo deve ser receita ou despesa (letras minusculas)'
        });
      }
 
      const result = await Transacao.criar({
        usuario_id,
        descricao,
        valor: Number(valor),
        tipo,
        data: data || new Date().toISOString().split('T')[0],
        // CORRIGIDO: passa categoria e forma_pagamento para o model
        categoria: categoria || null,
        forma_pagamento: forma_pagamento || null
      });
 
      res.status(201).json({
        mensagem: 'Transação salva no banco!',
        id: result.insertId
      });
    } catch (err) {
      console.error('Erro ao criar transação:', err);
      res.status(500).json({
        erro: 'Erro ao criar transação'
      });
    }
  },
 
  // ============================================
  // ATUALIZAR TRANSAÇÃO EXISTENTE (NOVO)
  // ============================================
  // Para que serve: recebe os novos dados, valida
  // e manda o model atualizar no banco. O usuario_id
  // garante que ninguém edita transação de outro usuário.
  atualizar: async (req, res) => {
    try {
      const usuario_id = req.usuario.id;
      const { id } = req.params;
      const { descricao, valor, tipo, data, categoria, forma_pagamento } = req.body;
 
      // VALIDA CAMPOS OBRIGATÓRIOS
      if (!descricao) {
        return res.status(400).json({ erro: 'O campo descricao é obrigatorio' });
      }
 
      if (valor == null || isNaN(Number(valor)) || Number(valor) <= 0) {
        return res.status(400).json({ erro: 'O campo valor é obrigatorio e deve ser maior que zero' });
      }
 
      if (!tipo) {
        return res.status(400).json({ erro: 'O campo tipo é obrigatorio' });
      }
 
      // VALIDA SE TIPO É RECEITA OU DESPESA (MINÚSCULO)
      if (tipo !== 'receita' && tipo !== 'despesa') {
        return res.status(400).json({
          erro: 'Tipo deve ser receita ou despesa (letras minusculas)'
        });
      }
 
      const result = await Transacao.atualizar(id, usuario_id, {
        descricao,
        valor: Number(valor),
        tipo,
        data: data || new Date().toISOString().split('T')[0],
        categoria: categoria || null,
        forma_pagamento: forma_pagamento || null
      });
 
      // SE NENHUMA LINHA FOI AFETADA, A TRANSAÇÃO NÃO EXISTE OU NÃO PERTENCE AO USUÁRIO
      if (result.affectedRows === 0) {
        return res.status(404).json({
          erro: 'Transação não encontrada ou sem permissão para editar'
        });
      }
 
      res.json({
        mensagem: 'Transação atualizada com sucesso'
      });
    } catch (erro) {
      console.error('Erro ao atualizar transação:', erro);
      res.status(500).json({
        erro: 'Erro ao atualizar transação'
      });
    }
  },
 
  // ============================================
  // DELETAR TRANSAÇÃO
  // ============================================
  deletar: async (req, res) => {
    try {
      const usuario_id = req.usuario.id;
      const { id } = req.params;
 
      const result = await Transacao.deletar(id, usuario_id);
 
      if (result.affectedRows === 0) {
        return res.status(404).json({
          erro: 'Transação não encontrada'
        });
      }
 
      res.json({
        mensagem: 'Transação deletada com sucesso'
      });
    } catch (erro) {
      console.error('Erro ao deletar transação:', erro);
      res.status(500).json({
        erro: 'Erro ao deletar transação'
      });
    }
  }
};
 
module.exports = transacaoController;