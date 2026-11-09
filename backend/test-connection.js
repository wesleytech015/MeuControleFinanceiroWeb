const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const pool = require('./database/conexao');
async function main() {
  try {
    const { rows } = await pool.query('SELECT 1 AS resultado');
    if (rows[0].resultado !== 1) throw new Error('Resposta inesperada');
    console.log(pool.options.ssl ? 'Conexão PostgreSQL com TLS validado estabelecida.' : 'Conexão PostgreSQL local estabelecida (loopback, sem TLS).');
  } catch {
    console.error('Falha ao conectar ao PostgreSQL. Verifique configuração, CA e acesso de rede.');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
main();
