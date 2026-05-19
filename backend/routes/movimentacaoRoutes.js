const express = require('express');
const router = express.Router();
const transacaoController = require('../controllers/transacaoController');

router.post('/movimentacao', transacaoController.criar);
router.get('/movimentacao', transacaoController.listar);
router.delete('/movimentacao/:id', transacaoController.deletar);

module.exports = router;

module.exports = router;
