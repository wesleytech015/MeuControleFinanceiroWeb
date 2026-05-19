/*
O que vai ter: Arquivos como TransacaoController.js.

Para que serve: Quando o Front-end pedir para salvar uma despesa, o Controller é quem vai validar se o valor não é negativo,
se a descrição foi preenchida, e depois mandar o Model salvar no banco. Ele também será responsável por calcular o saldo
total (somando receitas e subtraindo despesas) antes de enviar para a tela de Dashboard.
*/
const Transacao = require('../models/transacao');

const transacaoController = {
  listar: async (req, res) => {
    try {
      const usuario_id = req.usuario.id;

      const resultados = await Transacao.listarTodas(usuario_id);

      const saldo = resultados.reduce((acumulador, transacao) => {
        const valor = Number(transacao.valor);

        return transacao.tipo === 'receita'
          ? acumulador + valor
          : acumulador - valor;
      }, 0);

      const receitas = resultados
        .filter((transacao) => transacao.tipo === 'receita')
        .reduce((total, transacao) => total + Number(transacao.valor), 0);

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

  criar: async (req, res) => {
    try {
      const usuario_id = req.usuario.id;
      const { descricao, valor, tipo, data } = req.body;

      if (!descricao || valor == null || !tipo) {
        return res.status(400).json({
          erro: 'Dados obrigatórios'
        });
      }

      if (tipo !== 'receita' && tipo !== 'despesa') {
        return res.status(400).json({
          erro: 'Tipo deve ser receita ou despesa'
        });
      }

      const result = await Transacao.criar({
        usuario_id,
        descricao,
        valor: Number(valor),
        tipo,
        data: data || new Date().toISOString().split('T')[0]
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