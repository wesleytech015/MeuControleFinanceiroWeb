const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

router.post('/login', require('../middlewares/limitar').login, require('../middlewares/validar').login, loginController.login);

module.exports = router;
