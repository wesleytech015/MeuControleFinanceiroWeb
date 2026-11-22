const fs = require('node:fs');
const path = require('node:path');

function databaseOptions(env = process.env, readCertificate = fs.readFileSync) {
  for (const name of ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
    if (typeof env[name] !== 'string' || !env[name].trim()) throw new Error(`Configure ${name} para PostgreSQL.`);
  }
  const port = Number(env.DB_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DB_PORT deve ser uma porta válida.');
  if (env.DB_SSL && !['true', 'false'].includes(env.DB_SSL)) throw new Error('DB_SSL deve ser true ou false.');
  const local = ['127.0.0.1', '::1', 'localhost'].includes(env.DB_HOST);
  if (env.DB_SSL === 'false' && (!local || env.NODE_ENV === 'production' || env.VERCEL)) {
    throw new Error('DB_SSL=false só é permitido em desenvolvimento local isolado.');
  }
  const ssl = env.DB_SSL === 'false' ? false : { rejectUnauthorized: true, minVersion: 'TLSv1.2' };
  if (ssl && env.DB_SSL_CA_PEM?.trim()) ssl.ca = env.DB_SSL_CA_PEM.replace(/\\n/g, '\n');
  else if (ssl && env.DB_SSL_CA_PATH?.trim()) {
    ssl.ca = readCertificate(path.resolve(__dirname, '../..', env.DB_SSL_CA_PATH), 'utf8');
  }
  return {
    host: env.DB_HOST, port, user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME,
    ssl, max: env.VERCEL ? 2 : 10, connectionTimeoutMillis: 20000,
    idleTimeoutMillis: 30000, options: '-c timezone=UTC -c search_path=public',
  };
}
module.exports = { databaseOptions };
