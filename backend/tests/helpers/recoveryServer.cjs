// Processo de teste: recusa qualquer banco fora do cluster descartável em loopback.
const { Pool } = require('pg');
const options = JSON.parse(process.env.MCF_TEST_PG);
if (options.host !== '127.0.0.1' || options.user !== 'recovery_test' || options.database !== 'postgres' || options.ssl !== false) {
  throw new Error('Only the isolated PostgreSQL test cluster is allowed');
}
const pool = new Pool(options);
require.cache[require.resolve('../../database/conexao')] = { loaded: true, exports: pool };
const server = require('../../server').listen(0, '127.0.0.1', () => process.send({ port: server.address().port }));
process.on('message', async message => {
  if (message === 'stop') {
    await new Promise(resolve => server.close(resolve));
    await pool.end();
    process.disconnect();
  }
});
