const { test } = require('node:test');
const assert = require('node:assert/strict');
const { databaseOptions } = require('../config/databaseOptions');
const base = { DB_HOST: 'mysql.example.invalid', DB_USER: 'test', DB_PASSWORD: 'example-only', DB_NAME: 'test', DB_PORT: '12345', NODE_ENV: 'production' };

test('Aiven uses the configured port, certificate path and TLS verification', () => {
  let certificatePath;
  const options = databaseOptions({ ...base, DB_CA_PATH: '/etc/secrets/aiven-ca.pem' }, filename => { certificatePath = filename; return Buffer.from('test-certificate'); });
  assert.equal(options.port, 12345);
  assert.equal(certificatePath, '/etc/secrets/aiven-ca.pem');
  assert.equal(options.ssl.rejectUnauthorized, true);
  assert.equal(options.ssl.minVersion, 'TLSv1.2');
});

test('TLS cannot be disabled in production or for a remote host', () => {
  assert.throws(() => databaseOptions({ ...base, DB_SSL: 'false' }), /desenvolvimento/);
  assert.throws(() => databaseOptions({ ...base, DB_HOST: '127.0.0.1', DB_SSL: 'false' }), /desenvolvimento/);
  assert.throws(() => databaseOptions({ ...base, NODE_ENV: 'development', DB_SSL: 'false' }), /desenvolvimento/);
});

test('local development keeps an explicit TLS exception and does not load a certificate', () => {
  const options = databaseOptions({ ...base, DB_HOST: '127.0.0.1', NODE_ENV: 'development', DB_SSL: 'false' }, () => { throw new Error('Unexpected certificate read'); });
  assert.equal(options.ssl, undefined);
});

test('missing configuration and invalid ports fail without exposing passwords', () => {
  for (const patch of [{ DB_HOST: '' }, { DB_USER: '' }, { DB_NAME: '' }, { DB_PASSWORD: '' }, { DB_PORT: 'NaN' }, { DB_PORT: '0' }, { DB_PORT: '65536' }, { DB_SSL: 'invalid' }]) {
    assert.throws(() => databaseOptions({ ...base, ...patch }, () => Buffer.from('test')));
  }
});
