const fs = require('node:fs');
const path = require('node:path');
const { Pool, types } = require('pg');

for (const key of ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
  if (!process.env[key] || !process.env[key].trim()) {
    throw new Error(key + ' é obrigatória para configurar o PostgreSQL.');
  }
}
const port = Number(process.env.DB_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT deve ser uma porta válida.');
}

// Preserva o comportamento padrão do mysql2 para DATE: Date à meia-noite local.
// JSON continua serializando Date em ISO; mantenha o mesmo TZ do backend anterior.
const parsers = {
  getTypeParser(oid, format) {
    if (oid === 1082 && format !== 'binary') {
      return (value) => new Date(value + 'T00:00:00');
    }
    return types.getTypeParser(oid, format);
  }
};
const ssl = { rejectUnauthorized: true, minVersion: 'TLSv1.2' };
if (process.env.DB_SSL_CA_PATH) {
  // Caminhos relativos são resolvidos a partir da raiz do projeto.
  ssl.ca = fs.readFileSync(path.resolve(__dirname, '../..', process.env.DB_SSL_CA_PATH), 'utf8');
}
const pool = new Pool({
  host: process.env.DB_HOST,
  port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl,
  types: parsers,
  max: 10,
  connectionTimeoutMillis: 20000,
  idleTimeoutMillis: 30000,
  options: '-c timezone=UTC -c search_path=public'
});
// Não registra mensagens do servidor, que podem conter detalhes sensíveis.
pool.on('error', () => console.error('Erro inesperado em conexão PostgreSQL ociosa.'));
module.exports = pool;
