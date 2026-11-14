const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

// Testes HTTP locais com pool simulado: nenhuma consulta chega ao Supabase.
process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
const users = [];
const transactions = [];
const result = (rows) => ({ rows, rowCount: rows.length });
const pool = {
  async query(sql, values = []) {
    const query = sql.replace(/\s+/g, ' ').trim();
    assert.ok(!query.includes('?'));
    if (query.startsWith('INSERT INTO usuarios')) {
      assert.match(query, /RETURNING id$/);
      if (users.some((user) => user.email === values[1])) {
        throw Object.assign(new Error('Duplicado'), { code: '23505' });
      }
      const user = { id: users.length + 1, nome: values[0], email: values[1], senha: values[2] };
      users.push(user);
      return result([{ id: user.id }]);
    }
    if (query === 'SELECT * FROM usuarios WHERE email = $1') {
      return result(users.filter((user) => user.email === values[0]));
    }
    if (query === 'SELECT id, nome, email, criado_em FROM usuarios WHERE id = $1') {
      return result(users.filter(user => user.id === values[0]).map((user) => {
        const publicUser = { ...user };
        delete publicUser.senha;
        return publicUser;
      }));
    }
    if (query.startsWith('INSERT INTO movimentacoes')) {
      assert.match(query, /VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7\) RETURNING id$/);
      const [usuario_id, descricao, valor, tipo, data, categoria, forma_pagamento] = values;
      const tx = { id: transactions.length + 1, usuario_id, descricao, valor: Number(valor).toFixed(2), tipo, data, categoria, forma_pagamento };
      transactions.push(tx);
      return result([{ id: tx.id }]);
    }
    if (query.startsWith('SELECT * FROM movimentacoes')) {
      assert.equal(query, 'SELECT * FROM movimentacoes WHERE usuario_id = $1 ORDER BY data DESC');
      return result(transactions.filter((tx) => tx.usuario_id === values[0]).sort((a, b) => b.data.localeCompare(a.data)));
    }
    if (query.startsWith('UPDATE movimentacoes')) {
      assert.match(query, /WHERE id = \$7 AND usuario_id = \$8$/);
      const tx = transactions.find((row) => row.id === Number(values[6]) && row.usuario_id === values[7]);
      if (!tx) return result([]);
      const [descricao, valor, tipo, data, categoria, forma_pagamento] = values;
      Object.assign(tx, { descricao, valor: Number(valor).toFixed(2), tipo, data, categoria, forma_pagamento });
      return result([tx]);
    }
    if (query.startsWith('DELETE FROM movimentacoes')) {
      assert.equal(query, 'DELETE FROM movimentacoes WHERE id = $1 AND usuario_id = $2');
      const index = transactions.findIndex((row) => row.id === Number(values[0]) && row.usuario_id === values[1]);
      return result(index < 0 ? [] : transactions.splice(index, 1));
    }
    throw new Error('Consulta inesperada no teste');
  }
};
require.cache[require.resolve('../database/conexao')] = {
  id: require.resolve('../database/conexao'), loaded: true, exports: pool
};
const app = require('../server');
let server;
let base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => { await new Promise((resolve) => server.close(resolve)); });

async function request(path, method = 'GET', body, token) {
  const response = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
}

test('cadastro, bcrypt, login e contratos JWT; CRUD e isolamento entre dois usuários', async () => {
  const alice = { nome: 'Alice', email: 'alice@example.invalid', senha: 'senha-de-teste' };
  const bob = { nome: 'Bob', email: 'bob@example.invalid', senha: 'outra-senha' };
  assert.equal((await request('/usuarios', 'POST', {})).status, 400);
  const signup = await request('/usuarios', 'POST', alice);
  assert.equal(signup.status, 201);
  assert.deepEqual(Object.keys(signup.body).sort(), ['id', 'mensagem']);
  assert.notEqual(users[0].senha, alice.senha);
  assert.ok(await require('bcrypt').compare(alice.senha, users[0].senha));
  const duplicate = await request('/usuarios', 'POST', alice);
  assert.equal(duplicate.status, 409);
  assert.deepEqual(duplicate.body, { erro: 'Este e-mail já está cadastrado.', codigo: 'EMAIL_EXISTS' });
  assert.equal((await request('/usuarios', 'POST', bob)).status, 201);
  const shortPasswordUser = { nome: 'Carla', email: 'carla@example.invalid', senha: 'mF7!x2' };
  assert.equal((await request('/usuarios', 'POST', shortPasswordUser)).status, 201);
  assert.ok(await require('bcrypt').compare(shortPasswordUser.senha, users[2].senha));
  assert.equal((await request('/login', 'POST', shortPasswordUser)).status, 200);
  assert.equal((await request('/login', 'POST', { email: alice.email, senha: 'incorreta' })).status, 401);
  assert.equal((await request('/login', 'POST', {})).status, 400);
  const login = await request('/login', 'POST', alice);
  assert.equal(login.status, 200);
  assert.deepEqual(Object.keys(login.body).sort(), ['mensagem', 'token', 'usuario']);
  assert.deepEqual(login.body.usuario, { id: 1, nome: alice.nome, email: alice.email });
  const tokenA = login.body.token;
  const tokenB = (await request('/login', 'POST', bob)).body.token;
  const payload = jwt.verify(tokenA, process.env.JWT_SECRET);
  assert.equal(payload.exp - payload.iat, 86400);
  assert.equal((await request('/transacoes')).status, 401);
  assert.equal((await request('/transacoes', 'GET', undefined, 'invalido')).status, 401);
  const expired = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: -1 });
  assert.equal((await request('/transacoes', 'GET', undefined, expired)).status, 401);
  const listing = await request('/usuarios', 'GET', undefined, tokenA);
  assert.ok(listing.body.every((user) => !Object.hasOwn(user, 'senha')));
  assert.deepEqual(listing.body.map(user => user.id), [1]);
  assert.deepEqual((await request('/transacoes', 'GET', undefined, tokenA)).body,
    { saldo: 0, receitas: 0, despesas: 0, transacoes: [] });
  for (const tipo of ['receita', 'despesa']) {
    const data = { descricao: tipo, valor: '10.25', tipo, data: '2026-11-08', categoria: 'Outros', forma_pagamento: 'pix', usuario_id: 2 };
    const created = await request('/transacoes', 'POST', data, tokenA);
    assert.equal(created.status, 201);
    const id = created.body.id;
    assert.equal(transactions.at(-1).usuario_id, 1);
    assert.equal((await request('/transacoes', 'GET', undefined, tokenB)).body.transacoes.length, 0);
    assert.equal((await request(`/transacoes/${id}`, 'PUT', data, tokenB)).status, 404);
    assert.equal((await request(`/transacoes/${id}`, 'DELETE', undefined, tokenB)).status, 404);
    const totals = (await request('/transacoes', 'GET', undefined, tokenA)).body;
    assert.equal(totals.saldo, tipo === 'receita' ? 10.25 : -10.25);
    assert.equal(totals[tipo === 'receita' ? 'receitas' : 'despesas'], 10.25);
    assert.equal((await request(`/transacoes/${id}`, 'PUT', { ...data, valor: 20 }, tokenA)).status, 200);
    assert.equal((await request(`/transacoes/${id}`, 'DELETE', undefined, tokenA)).status, 200);
    assert.equal((await request(`/transacoes/${id}`, 'DELETE', undefined, tokenA)).status, 404);
  }
  assert.equal((await request('/transacoes', 'POST', { descricao: 'x', tipo: 'receita', valor: -1 }, tokenA)).status, 400);
  assert.equal((await request('/transacoes', 'POST', { descricao: 'x', tipo: 'invalido', valor: 1 }, tokenA)).status, 400);
});

test('health público responde sem consultar o banco ou revelar configuração', async () => {
  const query = pool.query;
  pool.query = () => { throw new Error('Health não deve consultar o banco'); };
  try {
    const response = await fetch(base + '/health');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-powered-by'), null);
  } finally {
    pool.query = query;
  }
});

test('entradas inválidas, JWT alternativo e injeções são rejeitados antes de gravar', async () => {
  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
  const body = { descricao: 'Teste', valor: '10.25', tipo: 'receita', data: '2026-11-10' };
  const size = transactions.length;
  for (const valor of [true, false, {}, [], 'Infinity', '1e3', '10.251', '1 OR 1=1', 0, -1]) {
    assert.equal((await request('/transacoes', 'POST', { ...body, valor }, token)).status, 400);
  }
  for (const data of ['2026-02-31', '2026-13-01', 'not-a-date', null]) {
    assert.equal((await request('/transacoes', 'POST', { ...body, data }, token)).status, 400);
  }
  assert.equal(transactions.length, size);
  assert.equal((await request('/transacoes/1%20OR%201=1', 'DELETE', undefined, token)).status, 400);
  assert.equal((await request('/usuarios', 'POST', {nome:'Test',email:'test@example.invalid',senha:'x'})).status, 400);
  assert.equal((await request('/usuarios', 'POST', {nome:'Test',email:'test@example.invalid',senha:'á'.repeat(37)})).status, 400);
  const alternate = jwt.sign({id:1}, process.env.JWT_SECRET, {algorithm:'HS384'});
  assert.equal((await request('/transacoes', 'GET', undefined, alternate)).status, 401);
  const invalidId = jwt.sign({id:'1 OR 1=1'}, process.env.JWT_SECRET);
  assert.equal((await request('/transacoes', 'GET', undefined, invalidId)).status, 401);
  const malformed = await fetch(base + '/login', {method:'POST',headers:{'Content-Type':'application/json'},body:'{'});
  assert.equal(malformed.status, 400);
  assert.ok((await malformed.json()).erro);
  const oversized = await fetch(base + '/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senha:'x'.repeat(20000)})});
  assert.equal(oversized.status, 413);
  assert.ok((await oversized.json()).erro);
});

test('login limita tentativas e informa quando tentar novamente', async () => {
  let blocked;
  for (let i=0; i<17; i++) {
    const response = await fetch(base+'/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'absent@example.invalid',senha:'invalid'})});
    if (response.status === 429) { blocked = response; break; }
  }
  assert.ok(blocked);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  assert.ok((await blocked.json()).erro);
});

test('rotas incompletas de cartões e movimentação legada continuam desativadas', async () => {
  assert.ok(require('../routes/movimentacaoRoutes'));
  const response = await fetch(base + '/cartoes');
  assert.equal(response.status, 404);
  assert.equal((await fetch(base + '/movimentacao')).status, 404);
});
