// Diagnostic only. Uses a recording fake pool; never connects to a database.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
const calls = [];
const pool = { async query(sql, values = []) {
  calls.push({ sql, values });
  if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql) || sql.startsWith('SET LOCAL')) return { rows: [] };
  if (sql.startsWith('SELECT COALESCE(v.versao')) return { rows: values[0] === 1 ? [{ auth_version: 0 }] : [] };
  if (sql.startsWith('SELECT id, nome, email, criado_em FROM usuarios WHERE id = $1')) {
    return { rows: [{id:1,email:'a@example.invalid'}, {id:2,email:'b@example.invalid'}].filter(user=>user.id===values[0]) };
  }
  if (sql.startsWith('SELECT')) return { rows: [], rowCount: 0 };
  return { rows: [{id:1}], rowCount: 1 };
}};
pool.connect = async () => ({ query: (...args) => pool.query(...args), release() {} });
const db = require.resolve('../database/conexao');
require.cache[db] = {id:db,loaded:true,exports:pool};
const Usuario = require('../models/usuario');
const Transacao = require('../models/transacao');
const jwt = require('jsonwebtoken');
const app = require('../server');
async function main() {
  const payload = "' OR '1'='1'; --";
  await Usuario.buscarPorEmail(payload);
  await Usuario.criar({nome:payload,email:payload,senha:'test-hash'});
  await Transacao.criar({usuario_id:1,descricao:payload,valor:'10.00',tipo:'despesa',data:'2026-11-10',categoria:payload,forma_pagamento:payload});
  await Transacao.atualizar(payload,1,{descricao:payload,valor:'10.00',tipo:'despesa',data:'2026-11-10',categoria:payload,forma_pagamento:payload});
  await Transacao.deletar(payload,1);
  for (const call of calls) {
    assert.ok(!call.sql.includes(payload));
    assert.ok(call.values.includes(payload));
    assert.match(call.sql,/\$1/);
  }
  console.log('PASS: 5 model operations keep injection payloads in bound parameters. No real SQL execution.');
  const server = app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const token = jwt.sign({id:1},process.env.JWT_SECRET,{expiresIn:'5m'});
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(path,method='GET',body,auth=token) {
    const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:`Bearer ${auth}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
    return {status:response.status,body:await response.json()};
  }
  try {
    assert.equal((await request('/login','POST',{email:payload,senha:'invalid'},null)).status,400);
    console.log('PASS: SQL-shaped login cannot bypass authentication in mocked HTTP flow.');
    assert.equal((await request('/transacoes','GET',undefined,'invalid')).status,401);
    assert.equal((await request('/transacoes','GET',undefined,jwt.sign({id:1},process.env.JWT_SECRET,{expiresIn:-1}))).status,401);
    console.log('PASS: invalid and expired JWT rejected.');
    const users=await request('/usuarios');
    assert.ok(!users.body.some(u=>u.id!==1));
    console.log(users.body.some(u=>u.id!==1)?'FINDING HIGH: authenticated account can list another account email.':'PASS: user list isolated.');
    const body={descricao:'security probe',valor:true,tipo:'receita',data:'2026-11-10'};
    assert.equal((await request('/transacoes','POST',body)).status,400);
    console.log(false?'FINDING MEDIUM: boolean financial amount accepted as 1.':'PASS: boolean amount rejected.');
    const before=calls.length;
    await request('/transacoes','POST',{...body,valor:1,data:'2026-02-31'});
    assert.equal(calls.length,before + 1); // Apenas a consulta de autenticação, sem SQL financeiro.
    assert.match(calls.at(-1).sql, /SELECT COALESCE\(v.versao/);
    console.log(false?'FINDING MEDIUM: impossible calendar date reaches database layer.':'PASS: invalid date rejected before SQL.');
    const weak=await request('/usuarios','POST',{nome:'Probe',email:'probe@example.invalid',senha:'x'},null);
    assert.equal(weak.status,400);
    console.log(false?'FINDING MEDIUM: one-character registration password accepted.':'PASS: weak password rejected.');
    const statuses=[];
    for(let i=0;i<17;i++) statuses.push((await request('/login','POST',{email:'absent@example.invalid',senha:'invalid'},null)).status);
    assert.ok(statuses.includes(429));
    console.log(!statuses.includes(429)?'FINDING MEDIUM: 15 consecutive failed logins not rate-limited; no middleware present.':'INFO: login statuses '+statuses.join(','));
    const bad = jwt.sign({id:1},process.env.JWT_SECRET,{algorithm:'HS384'});
    assert.equal((await request('/transacoes','GET',undefined,bad)).status,401);
    console.log(false?'FINDING LOW: JWT verifier accepts HS384 in addition to issued HS256.':'PASS: alternative algorithm rejected.');
  } finally { await new Promise(resolve=>server.close(resolve)); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
