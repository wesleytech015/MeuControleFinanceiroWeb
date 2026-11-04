const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middlewares/authRateLimit');
const loginController = require('../controllers/loginController');

const { credentials } = require('../middlewares/authInput');
router.post('/login', authLimiter, credentials, loginController.login);

module.exports = router;