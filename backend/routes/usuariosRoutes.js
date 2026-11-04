const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middlewares/authRateLimit');
const usuarioController = require('../controllers/usuarioController');
const autenticar = require('../middlewares/autenticar');

// POST /api/usuarios
const { registration } = require('../middlewares/authInput');
router.post('/', authLimiter, registration, usuarioController.criar);

// GET /api/usuarios
router.get('/', autenticar, usuarioController.listar);

module.exports = router;
