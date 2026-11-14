import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCadastro, cadastroError, cadastroErrorField } from '../src/services/cadastroValidation.js';
import { cadastrar } from '../src/services/api.js';

const valid = { nome: 'Maria', email: 'maria@example.com', senha: 'mF7!x2', confirmacao: 'mF7!x2' };

test('cadastro validates required fields, whitespace, email and confirmation', () => {
  const errors = validateCadastro({ nome: '   ', email: '', senha: '', confirmacao: '' });
  assert.deepEqual(Object.keys(errors), ['nome', 'email', 'senha', 'confirmacao']);
  for (const email of ['invalid', 'a@', '@example.com', 'a@@example.com', 'a b@example.com']) {
    assert.ok(validateCadastro({ ...valid, email }).email);
  }
  assert.ok(validateCadastro({ ...valid, nome: 'a'.repeat(101) }).nome);
  assert.ok(validateCadastro({ ...valid, email: 'a'.repeat(95) + '@example.com' }).email);
  assert.ok(validateCadastro({ ...valid, confirmacao: 'different' }).confirmacao);
  assert.deepEqual(validateCadastro({ ...valid, nome: ' Maria ', email: ' maria@example.com ' }), {});
});

test('password accepts 6 through 72 bytes without trimming and rejects UTF-8 overflow', () => {
  assert.ok(validateCadastro({ ...valid, senha: '12345', confirmacao: '12345' }).senha);
  for (const senha of ['mF7!x2', 'mF7!x2z', 'a'.repeat(72), 'á'.repeat(36), '😀'.repeat(18), ' abcde ']) {
    assert.deepEqual(validateCadastro({ ...valid, senha, confirmacao: senha }), {});
  }
  for (const senha of ['a'.repeat(73), 'á'.repeat(37), '😀'.repeat(19)]) {
    assert.equal(validateCadastro({ ...valid, senha, confirmacao: senha }).senha, 'A senha excede o tamanho máximo permitido.');
  }
});

test('specific password messages and common passwords agree with the backend policy', () => {
  assert.equal(validateCadastro({ ...valid, senha: '12345' }).senha, 'A senha deve ter pelo menos 6 caracteres.');
  for (const senha of ['123456', '1234567', 'password', 'PASSWORD', 'senha123']) {
    assert.equal(validateCadastro({ ...valid, senha, confirmacao: senha }).senha,
      'Escolha uma senha mais segura. Evite sequências como 123456.');
  }
  assert.equal(validateCadastro({ ...valid, confirmacao: 'different' }).confirmacao, 'As senhas não coincidem.');
});

test('only explicit API codes identify a password error; legacy 400 remains general', () => {
  const legacy = { status: 400, message: 'Confira os campos informados.' };
  assert.equal(cadastroError(legacy), legacy.message);
  assert.equal(cadastroErrorField(legacy), undefined);
  assert.equal(cadastroErrorField({ ...legacy, code: 'EMAIL_INVALID' }), 'email');
  assert.equal(cadastroErrorField({ ...legacy, code: 'PASSWORD_COMMON' }), 'senha');
  assert.equal(cadastroError({ ...legacy, code: 'PASSWORD_COMMON' }), 'Escolha uma senha mais segura. Evite sequências como 123456.');
  assert.equal(cadastroError({ status: 409 }), 'Este e-mail já está cadastrado.');
});

test('signup preserves the API contract and successful result', async (t) => {
  let calls = 0;
  const body = { mensagem: 'Usuário cadastrado com sucesso!', id: 42 };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++;
    assert.ok(url.endsWith('/usuarios'));
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { nome: valid.nome, email: valid.email, senha: ' abcde ' });
    return { ok: true, json: async () => body };
  });
  assert.deepEqual(await cadastrar(valid.nome, valid.email, ' abcde '), body);
  assert.equal(calls, 1);
});

test('signup retains API errors and status, including non-JSON failures', async (t) => {
  for (const status of [400, 409, 429, 500]) {
    t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status, json: async () => ({ erro: 'Detalhe da API', codigo: 'API_DETAIL' }) }));
    await assert.rejects(cadastrar(valid.nome, valid.email, valid.senha), error => {
      assert.equal(error.status, status);
      assert.equal(error.message, 'Detalhe da API');
      assert.equal(error.code, 'API_DETAIL');
      assert.ok(cadastroError(error));
      return true;
    });
  }
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 503, json: async () => { throw new SyntaxError(); } }));
  await assert.rejects(cadastrar(valid.nome, valid.email, valid.senha), { status: 503 });
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(cadastrar(valid.nome, valid.email, valid.senha), error => {
    assert.match(cadastroError(error), /conectar/);
    return true;
  });
});

test('signup timeout cancels only its request at 15 seconds', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let signal;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    signal = options.signal;
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  });
  const pending = assert.rejects(cadastrar(valid.nome, valid.email, valid.senha), error => {
    assert.equal(error.name, 'TimeoutError');
    assert.match(cadastroError(error), /Verifique se a conta foi criada/);
    return true;
  });
  t.mock.timers.tick(14_999);
  assert.equal(signal.aborted, false);
  t.mock.timers.tick(1);
  await pending;
});
