const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cadastro } = require('../middlewares/validar');

function validate(body) {
  let accepted = false;
  let status;
  let response;
  const res = {
    status(value) { status = value; return this; },
    json(value) { response = value; return this; }
  };
  cadastro({ body }, res, () => { accepted = true; });
  return { accepted, status, response };
}

test('cadastro accepts 6-character passwords and bcrypt byte boundaries for Mobile and Web', () => {
  for (const senha of ['mF7!x2', 'mF7!x2z', 'a'.repeat(72), 'á'.repeat(36), '😀'.repeat(18), ' abcde ']) {
    assert.equal(validate({ nome: 'Maria', email: 'maria@example.com', senha }).accepted, true);
  }
});

test('cadastro rejects invalid fields with specific errors and preserves erro contract', () => {
  const valid = { nome: 'Maria', email: 'maria@example.com', senha: 'mF7!x2' };
  for (const body of [null, [], {}, { ...valid, nome: '   ' }, { ...valid, email: 'invalid' },
    { ...valid, senha: '' }, { ...valid, senha: '12345' }, { ...valid, senha: 123456 },
    { ...valid, senha: 'a'.repeat(73) }, { ...valid, senha: 'á'.repeat(37) }]) {
    const result = validate(body);
    assert.equal(result.accepted, false);
    assert.equal(result.status, 400);
    assert.equal(typeof result.response.erro, 'string');
  }
  assert.match(validate({ ...valid, senha: '12345' }).response.erro, /6 caracteres/);
  assert.equal(validate({ ...valid, senha: 'á'.repeat(37) }).response.erro, 'A senha excede o tamanho máximo permitido.');
});

test('password codes and messages follow the policy shared with the frontend', () => {
  const policy = require('../config/cadastroPassword.json');
  const valid = { nome: 'Maria', email: 'maria@example.com' };
  for (const [senha, codigo] of [['', 'PASSWORD_REQUIRED'], ['12345', 'PASSWORD_TOO_SHORT'],
    ['a'.repeat(73), 'PASSWORD_TOO_LONG'], ...policy.common.map(senha => [senha, 'PASSWORD_COMMON']),
    ['PASSWORD', 'PASSWORD_COMMON']]) {
    const result = validate({ ...valid, senha });
    assert.equal(result.status, 400);
    assert.deepEqual(result.response, { codigo, erro: policy.errors[codigo] });
  }
  assert.equal(validate({ ...valid, senha: 'mF7!x2', email: 'invalid' }).response.codigo, 'EMAIL_INVALID');
});
