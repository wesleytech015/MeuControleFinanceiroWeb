const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const backend = path.resolve(__dirname, '..');
require(path.join(backend, 'node_modules/dotenv')).config({path:path.join(backend,'../.env'),quiet:true});
assert.equal(process.env.DB_HOST,'127.0.0.1','Only the local database may be tested');
assert.match(process.env.DB_NAME, /^dashboard_test_[a-f0-9]+$/, 'Only the isolated test database may be used');
const pool = require(path.join(backend,'database/conexao'));
const jwt = require(path.join(backend,'node_modules/jsonwebtoken'));
const base = process.env.API_TEST_BASE_URL || 'http://127.0.0.1:3001/api';
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Only a local API may be tested');
const emails = [0,1].map(()=>`api-audit-${crypto.randomUUID()}@example.invalid`);
const senha = crypto.randomBytes(24).toString('hex');
const results = [];
async function check(name,method,route,body,token,expected,validate) {
  const entry={name,method,route,expected}; results.push(entry);
  try {
    const r=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)});
    entry.status=r.status;
    const text=await r.text(); let data; try {data=JSON.parse(text);}catch{data=text;}
    // Never persist credentials, JWTs, user lists, or password hashes.
    if(route==='/transacoes' && method==='GET' && r.status===200) entry.summary={saldo:data.saldo,receitas:data.receitas,despesas:data.despesas,count:data.transacoes?.length};
    if(data?.erro) entry.error=data.erro;
    assert.equal(r.status,expected); if(validate) await validate(data);
    entry.pass=true; console.log(`PASS ${method} ${route}: HTTP ${r.status} - ${name}`); return data;
  }catch(e){entry.pass=false;entry.failure=e.message;console.log(`FAIL ${method} ${route}: HTTP ${entry.status??'none'} - ${name}: ${e.message}`);return null;}
}
(async()=>{
 try {
  const [rows]=await pool.query('SELECT 1 AS ok'); assert.equal(rows[0].ok,1);
  await check('health GET','GET','/teste',undefined,null,200);
  await check('health POST','POST','/teste',{},null,200);
  await check('missing login fields','POST','/login',{},null,400);
  await check('missing registration fields','POST','/usuarios',{},null,400);
  for(const method of ['GET','POST','PUT','DELETE']) await check('missing JWT',method,method==='PUT'||method==='DELETE'?'/transacoes/0':'/transacoes',method==='POST'||method==='PUT'?{}:undefined,null,401);
  await check('invalid JWT','GET','/transacoes',undefined,'invalid',401);
  await check('expired JWT','GET','/transacoes',undefined,jwt.sign({id:0},process.env.JWT_SECRET,{expiresIn:-1}),401);
  for(const email of emails) await check('temporary registration','POST','/usuarios',{nome:'Temporary API audit',email,senha},null,201);
  await check('duplicate email','POST','/usuarios',{nome:'Temporary API audit',email:emails[0],senha},null,409);
  await check('wrong password','POST','/login',{email:emails[0],senha:'wrong'},null,401);
  const sessions=[];
  for(const email of emails) sessions.push(await check('valid login','POST','/login',{email,senha},null,200,d=>{assert.equal(typeof d.token,'string');assert.equal(d.usuario.email,email);}));
  if(sessions.some(s=>!s?.token)) throw Error('Valid authentication prerequisite failed');
  const [a,b]=sessions.map(s=>s.token);
  await check('empty Dashboard','GET','/transacoes',undefined,a,200,d=>{assert.equal(d.saldo,0);assert.equal(d.transacoes.length,0);});
  const receita={descricao:'Temporary audit income',tipo:'receita',valor:1250.50,data:'2026-10-29',categoria:'Salário',forma_pagamento:'Pix'};
  const despesa={...receita,descricao:'Temporary audit expense',tipo:'despesa',valor:250.25,categoria:'Outros'};
  const income=await check('create income','POST','/transacoes',receita,a,201);
  const expense=await check('create expense','POST','/transacoes',despesa,a,201);
  await check('Dashboard totals and persisted fields','GET','/transacoes',undefined,a,200,d=>{assert.equal(d.receitas,1250.50);assert.equal(d.despesas,250.25);assert.equal(d.saldo,1000.25);assert.equal(d.transacoes.length,2);assert.equal(d.transacoes.find(t=>t.id===income.id).categoria,'Salário');});
  await check('second user cannot see transactions','GET','/transacoes',undefined,b,200,d=>assert.equal(d.transacoes.length,0));
  if(income?.id){await check('second user cannot edit','PUT',`/transacoes/${income.id}`,receita,b,404);await check('second user cannot delete','DELETE',`/transacoes/${income.id}`,undefined,b,404);}
  for(const [name,patch] of [['negative value',{valor:-1}],['zero value',{valor:0}],['invalid type',{tipo:'transferencia'}],['empty description',{descricao:''}]]) await check(name,'POST','/transacoes',{...despesa,...patch},a,400);
  await check('invalid calendar date should be a client error','POST','/transacoes',{...despesa,data:'2026-02-30'},a,400);
  await check('boolean value should be rejected','POST','/transacoes',{...despesa,valor:true},a,400);
  await check('blank description should be rejected','POST','/transacoes',{...despesa,descricao:'   '},a,400);
  for (const [name, patch] of [
    ['impossible date', {data:'2026-02-30'}],
    ['non-leap February', {data:'2026-02-29'}],
    ['invalid month', {data:'2026-13-01'}],
    ['invalid date type', {data:true}],
    ['boolean amount', {valor:true}],
    ['array amount', {valor:[1]}],
    ['object amount', {valor:{}}],
    ['blank amount', {valor:' '}],
    ['blank description', {descricao:'   '}],
    ['non-string description', {descricao:7}]
  ]) {
    await check(name, 'POST', '/transacoes', {...despesa,...patch}, a, 400);
    if (expense?.id) await check(name, 'PUT', '/transacoes/'+expense.id, {...despesa,...patch}, a, 400);
  }
  await check('valid numeric string and leap date', 'POST', '/transacoes', {...receita,valor:'10.50',data:'2024-02-29'}, a, 201);
  await check('date omitted retains default', 'POST', '/transacoes', {...receita,data:undefined}, a, 201);
  await check('JWT signed by different secret', 'GET', '/transacoes', undefined, jwt.sign({id:sessions[0].usuario.id}, 'audit-wrong-secret'), 401);
  const unsigned = Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({id:sessions[0].usuario.id})).toString('base64url')+'.';
  await check('unsigned JWT rejected', 'GET', '/transacoes', undefined, unsigned, 401);
  await check('SQL injection login rejected', 'POST', '/login', {email:"' OR 1=1 --",senha:'irrelevant'}, undefined, 401);
  await check('user list requires authentication', 'GET', '/usuarios', undefined, undefined, 401);
  await check('user list must not expose another account', 'GET', '/usuarios', undefined, a, 200, d=>{assert(!d.some(u=>u.email===emails[1]),'A regular account can read another account email and name');});
  await check('amount below one cent must not become zero', 'POST', '/transacoes', {...receita,valor:0.001}, a, 400);
  await check('amount beyond database precision rejected as client error', 'POST', '/transacoes', {...receita,valor:10000000000000}, a, 400);
  await check('description beyond database limit rejected as client error', 'POST', '/transacoes', {...receita,descricao:'x'.repeat(201)}, a, 400);
  await check('users response must exclude password hashes','GET','/usuarios',undefined,a,200,d=>{assert(Array.isArray(d));assert(!d.some(u=>'senha' in u),'Response exposes senha field (hash)');});
  if(expense?.id) await check('update expense','PUT',`/transacoes/${expense.id}`,{...despesa,valor:300.25},a,200);
  if(income?.id){await check('delete income','DELETE',`/transacoes/${income.id}`,undefined,a,200);await check('repeat delete','DELETE',`/transacoes/${income.id}`,undefined,a,404);}
  if(expense?.id) await check('delete expense','DELETE',`/transacoes/${expense.id}`,undefined,a,200);
  for(const route of ['/dashboard','/receitas','/despesas']) await check('dedicated route availability','GET',route,undefined,a,404);
 }catch(e){results.push({name:'prerequisite',pass:false,failure:e.message});console.error(e.message);}
 finally {
  try{await pool.query('DELETE FROM usuarios WHERE email IN (?,?)',emails);const [rows]=await pool.query('SELECT COUNT(*) AS remaining FROM usuarios WHERE email IN (?,?)',emails);assert.equal(rows[0].remaining,0);results.push({name:'temporary accounts and cascading transactions cleaned',pass:true});}catch(e){results.push({name:'cleanup',pass:false,failure:e.message});}
  await pool.end();
  const report={executedAt:new Date().toISOString(),base,results,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length};
  if (process.env.API_TEST_REPORT) fs.writeFileSync(process.env.API_TEST_REPORT,JSON.stringify(report,null,2));
  console.log(`RESULT ${report.passed} passed, ${report.failed} failed`);process.exitCode=report.failed?1:0;
 }
})();
