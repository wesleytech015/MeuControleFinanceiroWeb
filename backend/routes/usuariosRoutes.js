const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const autenticar = require('../middlewares/autenticar');

// POST /api/usuarios
router.post('/', usuarioController.criar);

// GET /api/usuarios
router.get('/', autenticar, usuarioController.listar);

module.exports = router;
