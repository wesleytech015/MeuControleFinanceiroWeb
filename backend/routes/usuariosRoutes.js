const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const autenticar = require('../middlewares/autenticar');

// POST /api/usuarios
router.post('/', require('../middlewares/limitar').cadastro, require('../middlewares/validar').cadastro, usuarioController.criar);

// GET /api/usuarios
router.get('/', autenticar, usuarioController.listar);

module.exports = router;
