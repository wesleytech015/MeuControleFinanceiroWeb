const app = require('./app');

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => console.log('Servidor iniciado.'));
}

module.exports = app;
