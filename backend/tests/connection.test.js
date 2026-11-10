const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

function run(script, overrides = {}) {
  const env = { ...process.env, DB_HOST: 'localhost', DB_PORT: '5432', DB_USER: 'test', DB_PASSWORD: 'test-only', DB_NAME: 'test', DB_SSL_CA_PATH: '', ...overrides };
  return spawnSync(process.execPath, ['-e', script], { cwd: path.resolve(__dirname, '..'), env, encoding: 'utf8' });
}

test('pool único, TLS verificado, datas compatíveis e decimais exatos sem conexão remota', () => {
  const result = run(`
    const assert = require('node:assert/strict');
    const pool = require('./database/conexao');
    assert.equal(pool, require('./config/database'));
    assert.equal(pool, require('./config/db'));
    assert.equal(pool.options.ssl.rejectUnauthorized, true);
    assert.equal(pool.options.ssl.minVersion, 'TLSv1.2');
    assert.equal(pool.options.ssl.ca, undefined);
    assert.equal(pool.options.max, 10);
    assert.equal(pool.options.types.getTypeParser(1082, 'text')('2026-11-08').toISOString(), new Date(2026, 10, 8).toISOString());
    assert.equal(pool.options.types.getTypeParser(1700, 'text')('1234567890123.45'), '1234567890123.45');
    pool.end();
  `);
  assert.equal(result.status, 0, result.stderr);
});

test('configuração inválida e CA inexistente falham antes de abrir conexão', () => {
  for (const overrides of [{ DB_PASSWORD: '' }, { DB_PORT: 'abc' }, { DB_SSL_CA_PATH: 'arquivo-inexistente-supabase.cer' }]) {
    const result = run("require('./database/conexao')", overrides);
    assert.notEqual(result.status, 0);
  }
});

test('JWT ausente ou vazio impede inicialização mesmo antes de carregar Express', () => {
  for (const value of ['', '   ', 'short-secret']) {
    const result = run(`
      const Module = require('node:module');
      const load = Module._load;
      Module._load = function (id, ...args) {
        if (id === 'dotenv') return { config() {} };
        if (id === 'express') throw new Error('EXPRESS_CARREGADO');
        return load.call(this, id, ...args);
      };
      require('./server');
    `, { JWT_SECRET: value });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /JWT_SECRET/);
    assert.doesNotMatch(result.stderr, /EXPRESS_CARREGADO/);
  }
});
