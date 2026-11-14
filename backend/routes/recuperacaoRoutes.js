const router = require('express').Router();
const autenticar = require('../middlewares/autenticar');
const validar = require('../middlewares/validar');
const limitar = require('../middlewares/persistentLimit');
const controller = require('../controllers/recuperacaoController');

router.put('/usuarios/palavra-chave', autenticar, limitar.settingsIp, limitar.settingsUser, validar.configurarRecuperacao, controller.configurar);
router.post('/recuperacao-senha', require('../middlewares/recoveryEnabled'), limitar.recoveryIp, validar.redefinirSenha, limitar.recoveryAccount, controller.redefinir);
module.exports = router;
