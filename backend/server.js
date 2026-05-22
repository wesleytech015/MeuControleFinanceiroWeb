const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
