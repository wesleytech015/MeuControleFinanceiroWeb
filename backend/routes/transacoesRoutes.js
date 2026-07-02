const express = require('express');
const router = express.Router();
const transacaoController = require('../controllers/transacaoController');
const autenticar = require('../middlewares/autenticar');

// GET /api/transacoes → listar todas as transações do usuário logado
router.get('/', autenticar, transacaoController.listar);

// POST /api/transacoes → criar nova transação
router.post('/', autenticar, transacaoController.criar);

// PUT /api/transacoes/:id → atualizar transação existente (NOVO)
// Para que serve: o frontend chama essa rota ao salvar a edição de uma movimentação.
router.put('/:id', autenticar, transacaoController.atualizar);

// DELETE /api/transacoes/:id → deletar pelo id
router.delete('/:id', autenticar, transacaoController.deletar);

module.exports = router;