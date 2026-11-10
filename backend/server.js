const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  quiet: true
});

require('./config/jwt');

const express = require('express');
const cors = require('cors');

const app = express();

app.disable('x-powered-by');
// Liveness only: no database access or deployment secrets in this response.
app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'no-store').json({ status: 'ok' });
});

app.use(cors());
app.use(express.json({ limit: '16kb', inflate: false }));

// rotas
const testeRoutes = require('./routes/testeroutes');
const loginRoutes = require('./routes/loginRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const transacoesRoutes = require('./routes/transacoesRoutes');

// registro das rotas
app.use('/api', testeRoutes);
app.use('/api', loginRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/transacoes', transacoesRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.type === 'entity.too.large' ? 413
    : error.type === 'encoding.unsupported' ? 415
      : error.type === 'entity.parse.failed' ? 400 : 500;
  res.status(status).json({ erro: status === 500 ? 'Erro interno.' : 'Corpo da requisição inválido ou não suportado.' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado na porta ${server.address().port}`);
  });
}

module.exports = app;
