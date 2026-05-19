const express = require('express');
const router = express.Router();

router.get('/teste', (req, res) => {
    console.log('ROTA /api/teste FOI CHAMADA');
    res.send('GET funcionando');
});
router.post('/teste', (req, res) => {
    res.send('POST funcionando');
});

console.log('Arquivo carregado: testeroutes');

module.exports = router;