const express = require('express');
const router = express.Router();
const transacaoController = require('../controllers/transacaoController');
const autenticar = require('../middlewares/autenticar');



// GET /api/transacoes → listar todas
router.get('/', autenticar, transacaoController.listar);

// POST /api/transacoes → criar nova
router.post('/', autenticar, transacaoController.criar);

// DELETE /api/transacoes/:id → deletar pelo id
router.delete('/:id', autenticar, transacaoController.deletar);

module.exports = router;
