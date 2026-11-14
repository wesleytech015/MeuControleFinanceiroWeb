import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { validateRecoverySecret, validateRecoveryFields } from '../src/services/recoveryValidation.js';
import { configurarPalavraChave, redefinirPorPalavraChave } from '../src/services/recoveryApi.js';
const require = createRequire(import.meta.url);
const { validateSecret } = require('../backend/services/recoverySecret.js');

test('recovery policy agrees across frontend and backend for Unicode, bounds and weak phrases', () => {
  for (const value of ['', ' ', 'curta', 'minha frase secreta', '123456789012', '99'.repeat(10),
    'aaaa aaaa aaaa', 'qwertyuiopas', 'x'.repeat(257), 'Meu caderno azul guarda planetas', '🌌'.repeat(40) + ' segredo']) {
    assert.equal(validateRecoverySecret(value), validateSecret(value));
  }
  const phrase = 'Meu caderno azul guarda planetas';
  assert.equal(validateRecoverySecret(phrase), '');
  assert.ok(validateRecoverySecret(phrase, { senha: phrase }));
  assert.deepEqual(validateRecoveryFields({ palavraChave: phrase, confirmacaoPalavra: phrase }), {});
  assert.ok(validateRecoveryFields({ palavraChave: phrase, confirmacaoPalavra: 'different' }).confirmacaoPalavra);
});

test('settings needs a token and uses bearer auth while recovery sends no session', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++;
    const body = JSON.parse(options.body);
    if (options.method === 'PUT') {
      assert.equal(options.headers.Authorization, 'Bearer token');
      assert.deepEqual(body, { senhaAtual: 'mF7!x2', palavraChave: 'Meu caderno azul guarda planetas' });
    } else {
      assert.equal(options.headers.Authorization, undefined);
      assert.deepEqual(body, { email: 'user@example.com', palavraChave: 'Meu caderno azul guarda planetas', novaSenha: 'nF8!k3' });
    }
    return { ok: true, json: async () => ({ mensagem: 'Sucesso' }) };
  });
  await assert.rejects(configurarPalavraChave('mF7!x2', 'phrase'), /Entre na sua conta/);
  assert.equal(calls, 0);
  await configurarPalavraChave('mF7!x2', 'Meu caderno azul guarda planetas', 'token');
  await redefinirPorPalavraChave('user@example.com', 'Meu caderno azul guarda planetas', 'nF8!k3');
  assert.equal(calls, 2);
});

test('recovery API preserves invalid, expired session, unavailable server and connection errors', async t => {
  for (const status of [400, 401, 429, 500]) {
    t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status, json: async () => ({ erro: 'Mensagem', codigo: 'RECOVERY_INVALID' }) }));
    await assert.rejects(redefinirPorPalavraChave('a@b.com', 'phrase', 'nF8!k3'), error => {
      assert.equal(error.status, status); assert.equal(error.code, 'RECOVERY_INVALID'); return true;
    });
  }
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('network'); });
  await assert.rejects(redefinirPorPalavraChave('a@b.com', 'phrase', 'nF8!k3'), /conectar/);
});

test('recovery timeout is isolated and completes after fifteen seconds', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let signal;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    signal = options.signal;
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  });
  const pending = assert.rejects(redefinirPorPalavraChave('a@b.com', 'phrase', 'nF8!k3'), /demorou/);
  t.mock.timers.tick(14_999); assert.equal(signal.aborted, false);
  t.mock.timers.tick(1); await pending;
});
