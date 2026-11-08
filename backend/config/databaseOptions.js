const fs = require('fs');
const path = require('path');

function databaseOptions(env = process.env, readCertificate = fs.readFileSync) {
  for (const name of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
    if (typeof env[name] !== 'string' || !env[name].trim()) throw new Error(`Configure ${name}.`);
  }
  const port = Number(env.DB_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DB_PORT deve ser uma porta válida.');
  if (env.DB_SSL && !['true', 'false'].includes(env.DB_SSL)) throw new Error('DB_SSL deve ser true ou false.');
  const withoutTls = env.DB_SSL === 'false';
  // Plaintext is exclusively for the isolated local development database.
  if (withoutTls && (env.NODE_ENV === 'production' || env.DB_HOST !== '127.0.0.1')) {
    throw new Error('DB_SSL=false só é permitido em desenvolvimento com DB_HOST=127.0.0.1.');
  }
  return {
    host: env.DB_HOST, port, user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME,
    ssl: withoutTls ? undefined : {
      ca: env.DB_CA_PEM?.trim()
        ? Buffer.from(env.DB_CA_PEM.replace(/\\n/g, '\n'))
        : readCertificate(env.DB_CA_PATH || path.join(__dirname, '../certs/ca.pem')),
      minVersion: 'TLSv1.2', rejectUnauthorized: true,
    },
    // Vercel may create several instances; keep each pool small and dates in UTC.
    timezone: 'Z', connectTimeout: 20000, waitForConnections: true,
    connectionLimit: env.VERCEL ? 2 : 10, maxIdle: 2, idleTimeout: 10000, queueLimit: 20,
  };
}

module.exports = { databaseOptions };
