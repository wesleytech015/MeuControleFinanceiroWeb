const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { databaseOptions } = require('../config/databaseOptions');
test('Vercel accepts inline CA, keeps TLS verification and uses a bounded pool', () => {
  const options = databaseOptions({ DB_HOST: 'example.invalid', DB_USER: 'test', DB_PASSWORD: 'fixture-only', DB_NAME: 'test', DB_CA_PEM: 'certificate\\nline', NODE_ENV: 'production', VERCEL: '1' }, () => { throw Error('Unexpected file'); });
  assert.equal(options.ssl.ca.toString(), 'certificate\nline');
  assert.equal(options.ssl.rejectUnauthorized, true);
  assert.equal(options.connectionLimit, 2);
  assert.equal(options.timezone, 'Z');
});
test('Express entrypoint exports the app without opening a server on import', () => {
  const child = spawnSync(process.execPath, ['-e', "require('net').Server.prototype.listen=function(){throw Error('Unexpected listen')}; const app=require('./app'); if(typeof app !== 'function')process.exit(2); require('./database/conexao').end();"], {
    cwd: require('node:path').resolve(__dirname, '..'), encoding: 'utf8', timeout: 5000,
    env: { ...process.env, JWT_SECRET: 'isolated-test-secret-at-least-32-bytes', DB_HOST: '127.0.0.1', DB_USER: 'test', DB_PASSWORD: 'fixture', DB_NAME: 'unused', DB_SSL: 'false', NODE_ENV: 'development', WHATSAPP_ENABLED: 'false' },
  });
  assert.equal(child.status, 0, child.stderr);
});
