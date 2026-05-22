require('dotenv').config();
const connection = require('./database/conexao');

console.log("🔄 Testando conexão com Aiven...");

// Teste simples
connection.query('SELECT NOW() as agora', (err, results) => {
  if (err) {
    console.error('Erro na query:', err);
  } else {
    console.log('✅ Banco funcionando! Hora atual:', results[0].agora);
  }
  
  // Fecha a conexão após o teste
  connection.end();
});