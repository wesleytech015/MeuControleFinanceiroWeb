const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { available, start } = require('./helpers/isolatedPostgres.cjs');
const { validateSecret, hashSecret, compareSecret } = require('../services/recoverySecret');
const { recoveryWindow, failedAttempt, WINDOW_MS } = require('../services/recoveryWindow');

test('window boundaries: fifth failure blocks for exactly 15 minutes, expiry restarts count', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  const record = { tentativas: 4, inicio_janela: now, bloqueado_ate: null };
  const fifth = failedAttempt(recoveryWindow(record, now), now);
  assert.equal(fifth.attempts, 5);
  assert.equal(+fifth.blockedUntil, +now + WINDOW_MS);
  record.tentativas = 5; record.bloqueado_ate = fifth.blockedUntil;
  assert.equal(recoveryWindow(record, new Date(+now + WINDOW_MS - 1)).blocked, true);
  assert.equal(failedAttempt(recoveryWindow(record, new Date(+now + WINDOW_MS)), new Date(+now + WINDOW_MS)).attempts, 1);
  record.tentativas = 4; record.bloqueado_ate = null;
  assert.equal(recoveryWindow(record, new Date(+now + WINDOW_MS - 1)).attempts, 4);
  assert.equal(recoveryWindow(record, new Date(+now + WINDOW_MS)).attempts, 0);
});

test('secret policy and SHA-256 prehash preserve Unicode beyond bcrypt 72 bytes', async () => {
  for (const value of ['', ' ', 'curta', 'minha frase secreta', '123456789012', 'a'.repeat(12), 'x'.repeat(257)]) assert.ok(validateSecret(value));
  const phrase = '🌌'.repeat(40) + ' segredo';
  const hash = await hashSecret(phrase);
  assert.ok(await compareSecret(phrase, hash));
  assert.equal(await compareSecret('🌌'.repeat(40) + ' outro', hash), false);
});

test('PostgreSQL isolated recovery integration', { skip: available() ? false : 'initdb unavailable: install PostgreSQL or set PG_TEST_BIN; no external database fallback' }, async t => {
  let instance, pool, server, base;
  const phrase = 'Meu caderno azul guarda planetas';
  const oldPassword = 'mF7!x2';
  const newPassword = 'nF8!k3';
  let oldToken, bobToken;
  const savedEnv = Object.fromEntries(['JWT_SECRET', 'NODE_ENV', 'RECOVERY_ENABLED', 'TRUSTED_PROXY_CIDRS'].map(key => [key, process.env[key]]));
  t.after(async () => {
    try { if (server) await new Promise(resolve => server.close(resolve)); } finally {
      if (instance) await instance.stop();
      for (const [key, value] of Object.entries(savedEnv)) {
        if (value === undefined) delete process.env[key]; else process.env[key] = value;
      }
    }
  });
  instance = await start(); pool = instance.pool;
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  process.env.NODE_ENV = 'test'; process.env.RECOVERY_ENABLED = 'true'; process.env.TRUSTED_PROXY_CIDRS = '';
  require.cache[require.resolve('../database/conexao')] = { loaded: true, exports: pool };
  // Fixture independente: não lê nem executa arquivos de migração.
  await pool.query(`CREATE TABLE usuarios (id SERIAL PRIMARY KEY, nome TEXT NOT NULL, email TEXT UNIQUE NOT NULL, senha TEXT NOT NULL, criado_em TIMESTAMPTZ DEFAULT now());
    CREATE TABLE recuperacao_seguranca (usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id), palavra_hash VARCHAR(255) NOT NULL,
      tentativas INTEGER NOT NULL DEFAULT 0 CHECK(tentativas BETWEEN 0 AND 5), inicio_janela TIMESTAMPTZ, bloqueado_ate TIMESTAMPTZ, atualizado_em TIMESTAMPTZ DEFAULT now(),
      CHECK ((tentativas = 0 AND inicio_janela IS NULL AND bloqueado_ate IS NULL) OR
        (tentativas BETWEEN 1 AND 4 AND inicio_janela IS NOT NULL AND bloqueado_ate IS NULL) OR
        (tentativas = 5 AND inicio_janela IS NOT NULL AND bloqueado_ate IS NOT NULL)));
    CREATE TABLE autenticacao_versoes (usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id), versao INTEGER NOT NULL DEFAULT 0 CHECK(versao >= 0));
    CREATE TABLE seguranca_limites (escopo VARCHAR(64), chave_hash CHAR(64), tentativas INTEGER NOT NULL CHECK(tentativas BETWEEN 1 AND 1000000), expira_em TIMESTAMPTZ NOT NULL, PRIMARY KEY(escopo, chave_hash));
    CREATE FUNCTION fail_test_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected test failure'; END $$;`);
  const passwordHash = await bcrypt.hash(oldPassword, 10);
  const secretHash = await hashSecret(phrase);
  server = require('../server').listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
  async function reset() {
    await pool.query('TRUNCATE recuperacao_seguranca, autenticacao_versoes, seguranca_limites, usuarios RESTART IDENTITY CASCADE');
    await pool.query('INSERT INTO usuarios(nome,email,senha) VALUES ($1,$2,$3),($4,$5,$3)', ['Alice', 'alice@example.invalid', passwordHash, 'Bob', 'bob@example.invalid']);
    await pool.query('INSERT INTO recuperacao_seguranca(usuario_id,palavra_hash) VALUES (1,$1)', [secretHash]);
    oldToken = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
    bobToken = jwt.sign({ id: 2 }, process.env.JWT_SECRET);
  }
  async function request(path, body, token, method = 'POST', headers = {}) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json(), retry: response.headers.get('retry-after') };
  }
  const recover = (secret = phrase, email = 'alice@example.invalid', headers) => request('/recuperacao-senha', { email, palavraChave: secret, novaSenha: newPassword }, undefined, 'POST', headers);
  const session = token => request('/usuarios', undefined, token, 'GET');
  const row = async () => (await pool.query('SELECT * FROM recuperacao_seguranca WHERE usuario_id=1')).rows[0];
  const checkOldPassword = async () => assert.ok(await bcrypt.compare(oldPassword, (await pool.query('SELECT senha FROM usuarios WHERE id=1')).rows[0].senha));

  await t.test('five simultaneous wrong attempts persist exactly five failures and block even correct phrase', async () => {
    await reset();
    const responses = await Promise.all(Array.from({ length: 5 }, () => recover('wrong')));
    assert.ok(responses.every(response => response.status === 400));
    const record = await row();
    assert.equal(record.tentativas, 5);
    assert.ok(+record.bloqueado_ate - Date.now() > WINDOW_MS - 10000);
    assert.deepEqual((await recover()).body, responses[0].body);
    await checkOldPassword();
  });
  await t.test('expired block and expired nonblocked window restart with one attempt', async () => {
    for (const blocked of [true, false]) {
      await reset();
      await pool.query(`UPDATE recuperacao_seguranca SET tentativas=$1, inicio_janela=clock_timestamp()-interval '31 minutes', bloqueado_ate=${blocked ? "clock_timestamp()-interval '1 second'" : 'NULL'} WHERE usuario_id=1`, [blocked ? 5 : 4]);
      assert.equal((await recover('wrong')).status, 400);
      const record = await row(); assert.equal(record.tentativas, 1); assert.equal(record.bloqueado_ate, null);
      assert.ok(+record.inicio_janela > Date.now() - 10000);
    }
  });
  await t.test('legacy JWT, revoked JWT, new login and independent user sessions retain Mobile contracts', async () => {
    await reset();
    const versionZeroToken = (await request('/login', { email: 'alice@example.invalid', senha: oldPassword })).body.token;
    assert.equal(jwt.verify(versionZeroToken, process.env.JWT_SECRET).sv, 0);
    assert.equal((await session(oldToken)).status, 200);
    assert.equal((await session(bobToken)).status, 200);
    assert.equal((await recover()).status, 200);
    assert.equal((await session(oldToken)).status, 401);
    assert.equal((await session(versionZeroToken)).status, 401);
    assert.equal((await session(bobToken)).status, 200);
    assert.equal((await request('/login', { email: 'alice@example.invalid', senha: oldPassword })).status, 401);
    const login = await request('/login', { email: 'alice@example.invalid', senha: newPassword });
    assert.equal(login.status, 200); assert.deepEqual(Object.keys(login.body).sort(), ['mensagem', 'token', 'usuario']);
    assert.equal(jwt.verify(login.body.token, process.env.JWT_SECRET).sv, 1);
    assert.equal((await session(login.body.token)).status, 200);
    for (const sv of [-1, 0, '1', 1.5]) assert.equal((await session(jwt.sign({ id: 1, sv }, process.env.JWT_SECRET))).status, 401);
  });
  await t.test('login waits for concurrent password reset and observes committed password/version', async () => {
    await reset();
    await pool.query(`CREATE FUNCTION delay_test_password() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_sleep(1); RETURN NEW; END $$;
      CREATE TRIGGER delay_password BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION delay_test_password()`);
    let pending;
    try {
      pending = recover();
      const deadline = Date.now() + 5000;
      let sleeping = false;
      while (Date.now() < deadline) {
        const { rows } = await pool.query("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event='PgSleep') AS sleeping");
        if (rows[0].sleeping) { sleeping = true; break; }
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      assert.ok(sleeping, 'reset must hold the user row before starting concurrent login');
      const [resetResponse, oldLogin, newLogin] = await Promise.all([pending,
        request('/login', { email: 'alice@example.invalid', senha: oldPassword }),
        request('/login', { email: 'alice@example.invalid', senha: newPassword })]);
      assert.equal(resetResponse.status, 200); assert.equal(oldLogin.status, 401); assert.equal(newLogin.status, 200);
      assert.equal(jwt.verify(newLogin.body.token, process.env.JWT_SECRET).sv, 1);
      assert.equal((await session(newLogin.body.token)).status, 200);
    } finally {
      if (pending) await pending;
      await pool.query('DROP TRIGGER delay_password ON usuarios; DROP FUNCTION delay_test_password()');
    }
  });
  await t.test('simultaneous successful resets increment version without lost updates', async () => {
    await reset();
    const responses = await Promise.all([recover(), recover()]);
    assert.ok(responses.every(response => response.status === 200));
    assert.equal((await pool.query('SELECT versao FROM autenticacao_versoes WHERE usuario_id=1')).rows[0].versao, 2);
    assert.equal((await session(oldToken)).status, 401);
    assert.equal((await row()).tentativas, 0);
  });
  await t.test('transaction installs local timeouts and rollback releases connection', async () => {
    const { transaction } = require('../models/recuperacao');
    const settings = await transaction(async client => (await client.query("SELECT current_setting('lock_timeout') AS locks, current_setting('statement_timeout') AS statements")).rows[0]);
    assert.deepEqual(settings, { locks: '3s', statements: '5s' });
    await assert.rejects(transaction(async client => { await client.query('SELECT 1/0'); }));
    assert.equal((await pool.query('SELECT 1 AS ok')).rows[0].ok, 1);
  });
  await t.test('version write failure rolls password and recovery counters back in PostgreSQL', async () => {
    await reset(); await recover('wrong');
    const previous = await row();
    await pool.query('CREATE TRIGGER fail_version BEFORE INSERT OR UPDATE ON autenticacao_versoes FOR EACH ROW EXECUTE FUNCTION fail_test_write()');
    try {
      assert.equal((await recover()).status, 500); await checkOldPassword();
      assert.deepEqual(await row(), previous);
      assert.equal((await pool.query('SELECT * FROM autenticacao_versoes')).rowCount, 0);
      assert.equal((await session(oldToken)).status, 200);
    } finally { await pool.query('DROP TRIGGER fail_version ON autenticacao_versoes'); }
  });
  await t.test('limiter database failure denies recovery; auth database failure denies session and login', async () => {
    await reset();
    await pool.query('CREATE TRIGGER fail_limit BEFORE INSERT OR UPDATE ON seguranca_limites FOR EACH ROW EXECUTE FUNCTION fail_test_write()');
    try { assert.equal((await recover()).status, 503); await checkOldPassword(); }
    finally { await pool.query('DROP TRIGGER fail_limit ON seguranca_limites'); }
    await pool.query('ALTER TABLE autenticacao_versoes RENAME TO unavailable_versions');
    try {
      assert.equal((await session(oldToken)).status, 503);
      assert.equal((await request('/login', { email: 'alice@example.invalid', senha: oldPassword })).status, 500);
      assert.equal((await recover()).status, 500); await checkOldPassword();
    } finally { await pool.query('ALTER TABLE unavailable_versions RENAME TO autenticacao_versoes'); }
  });
  await t.test('nonexistent, unconfigured and incorrect accounts share generic response', async () => {
    await reset();
    const absent = await recover('wrong', 'absent@example.invalid');
    assert.equal(absent.status, 400);
    assert.deepEqual(await recover('wrong', 'bob@example.invalid'), absent);
    assert.deepEqual(await recover('wrong'), absent);
  });
  await t.test('settings requires JWT/current password and fresh session after recovery', async () => {
    await reset();
    const body = { senhaAtual: oldPassword, palavraChave: 'Um cometa verde cruza meu jardim' };
    assert.equal((await request('/usuarios/palavra-chave', body, undefined, 'PUT')).status, 401);
    assert.equal((await request('/usuarios/palavra-chave', { ...body, senhaAtual: 'wrong' }, oldToken, 'PUT')).status, 400);
    const response = await request('/usuarios/palavra-chave', body, oldToken, 'PUT');
    assert.equal(response.status, 200); assert.equal(JSON.stringify(response).includes(body.palavraChave), false);
    assert.ok(await compareSecret(body.palavraChave, (await row()).palavra_hash));
    assert.equal((await recover(body.palavraChave)).status, 200);
    assert.equal((await request('/usuarios/palavra-chave', body, oldToken, 'PUT')).status, 401);
  });
  await t.test('signup remains optional for Mobile; Web signup rolls back if secret write fails', async () => {
    await reset();
    const body = { nome: 'Carla', email: 'carla@example.invalid', senha: oldPassword };
    assert.equal((await request('/usuarios', body)).status, 201);
    assert.equal((await request('/usuarios', { ...body, email: 'web@example.invalid', palavraChave: phrase })).status, 201);
    await pool.query('CREATE TRIGGER fail_secret BEFORE INSERT OR UPDATE ON recuperacao_seguranca FOR EACH ROW EXECUTE FUNCTION fail_test_write()');
    try { assert.equal((await request('/usuarios', { ...body, email: 'failed@example.invalid', palavraChave: phrase })).status, 500); }
    finally { await pool.query('DROP TRIGGER fail_secret ON recuperacao_seguranca'); }
    assert.equal((await pool.query("SELECT * FROM usuarios WHERE email='failed@example.invalid'")).rowCount, 0);
  });
  await t.test('IP limiter is atomic under concurrency, ignores spoofed forwarding, expires persistently', async () => {
    await reset();
    const responses = await Promise.all(Array.from({ length: 12 }, (_, i) => recover('wrong', `absent${i}@example.invalid`, { 'X-Forwarded-For': `192.0.2.${i + 1}` })));
    assert.equal(responses.filter(response => response.status === 429).length, 2);
    assert.ok(responses.filter(response => response.status === 429).every(response => Number(response.retry) > 0));
    const limits = (await pool.query("SELECT * FROM seguranca_limites WHERE escopo='recuperacao-ip'")).rows;
    assert.equal(limits.length, 1); assert.equal(limits[0].tentativas, 12);
    await pool.query("UPDATE seguranca_limites SET expira_em=clock_timestamp()-interval '1 second'");
    assert.equal((await recover('wrong')).status, 400);
    assert.equal((await pool.query("SELECT tentativas FROM seguranca_limites WHERE escopo='recuperacao-ip'")).rows[0].tentativas, 1);
  });
  await t.test('persistent account and user limiters remain independent of client IP', async () => {
    await reset();
    const { persistentLimit } = require('../middlewares/persistentLimit');
    async function invoke(scope, identity, max) {
      let status = 200;
      const res = { status(value) { status = value; return this; }, set() { return this; }, json() { return this; } };
      await persistentLimit(scope, max, () => identity)({}, res, () => {});
      return status;
    }
    for (const [scope, max] of [['recuperacao-conta', 10], ['configuracao-usuario', 5]]) {
      const results = await Promise.all(Array.from({ length: max + 2 }, () => invoke(scope, 'same-user', max)));
      assert.equal(results.filter(status => status === 429).length, 2);
      assert.equal(await invoke(scope, 'other-user', max), 200);
    }
  });
  await t.test('settings route applies persistent per-user limit with generic rejection', async () => {
    await reset();
    const body = { senhaAtual: 'wrong', palavraChave: phrase };
    for (let i = 0; i < 5; i++) assert.equal((await request('/usuarios/palavra-chave', body, oldToken, 'PUT')).status, 400);
    // Isola o limite de usuário sem alterar a identidade autenticada.
    await pool.query("DELETE FROM seguranca_limites WHERE escopo='configuracao-ip'");
    const denied = await request('/usuarios/palavra-chave', body, oldToken, 'PUT');
    assert.equal(denied.status, 429); assert.ok(Number(denied.retry) > 0);
    assert.equal((await row()).palavra_hash, secretHash);
  });
  await t.test('production is always disabled and test recovery requires explicit opt-in', async () => {
    await reset(); process.env.NODE_ENV = 'production';
    try { assert.equal((await recover()).status, 403); await checkOldPassword(); }
    finally { process.env.NODE_ENV = 'test'; }
    process.env.RECOVERY_ENABLED = 'false';
    try { assert.equal((await recover()).status, 403); }
    finally { process.env.RECOVERY_ENABLED = 'true'; }
  });
});
