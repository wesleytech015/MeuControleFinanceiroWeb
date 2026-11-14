import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLogin } from '../src/services/loginValidation.js';
import { loginError } from '../src/services/loginError.js';
import { login } from '../src/services/api.js';

test('validates missing fields and email before login', () => {
  assert.equal(validateLogin('', ''), 'Informe seu e-mail e senha para continuar.');
  assert.equal(validateLogin('   ', 'senha'), 'Informe seu e-mail.');
  assert.equal(validateLogin('user@example.com', ''), 'Informe sua senha.');
  for (const email of ['invalid', 'a@', '@example.com', 'a b@example.com', 'a@@example.com']) {
    assert.equal(validateLogin(email, 'senha'), 'Informe um e-mail válido.');
  }
  assert.equal(validateLogin(' user@example.com ', ' senha '), '');
});

test('login sends one request and preserves response and password', async (t) => {
  const body = { token: 'jwt', usuario: { id: 1 } };
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++;
    assert.ok(url.endsWith('/login'));
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { email: 'user@example.com', senha: ' senha ' });
    assert.ok(options.signal instanceof globalThis.AbortSignal);
    return { ok: true, json: async () => body };
  });
  assert.deepEqual(await login('user@example.com', ' senha '), body);
  assert.equal(calls, 1);
});

test('HTTP failures retain API status and differ from connection errors', async (t) => {
  for (const status of [400, 401, 429, 500, 503]) {
    t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status }));
    await assert.rejects(login('user@example.com', 'senha'), error => {
      assert.equal(error.status, status);
      assert.equal(loginError(error).credentials, status === 401);
      return true;
    });
  }
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(login('user@example.com', 'senha'), error => {
    assert.match(loginError(error).message, /conectar/);
    assert.equal(loginError(error).credentials, false);
    return true;
  });
});

test('timeout aborts only login after 15 seconds and clears the timer', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const unrelated = new globalThis.AbortController();
  let signal;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    signal = options.signal;
    return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
  });
  const pending = login('user@example.com', 'senha');
  const rejection = assert.rejects(pending, error => {
    assert.equal(error.name, 'TimeoutError');
    assert.match(loginError(error).message, /demorou/);
    assert.equal(loginError(error).credentials, false);
    return true;
  });
  t.mock.timers.tick(14_999);
  assert.equal(signal.aborted, false);
  t.mock.timers.tick(1);
  await rejection;
  assert.equal(signal.aborted, true);
  assert.equal(unrelated.signal.aborted, false);
});
