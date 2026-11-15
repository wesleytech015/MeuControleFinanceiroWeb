// Opt-in local rehearsal: disposable PostgreSQL, real application SQL/HTTP, simulated providers.
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const {randomBytes,createHmac}=require('node:crypto');const {spawnSync}=require('node:child_process');
const backend=path.resolve(__dirname,'..');const root=path.resolve(backend,'..');
const name='mcf-qwen-test-'+randomBytes(6).toString('hex');const password=randomBytes(24).toString('hex');
const mobileRoot=process.env.MOBILE_TEST_ROOT||path.resolve(root,'../..');
const checks=[];let pool,server,started=false;
function docker(args){const r=spawnSync('docker',args,{encoding:'utf8',windowsHide:true,timeout:60000,env:{...process.env,POSTGRES_PASSWORD:password}});if(r.status!==0)throw Error('Docker failed: '+args[0]);return r.stdout.trim();}
function check(label,value){assert.ok(value,label);checks.push(label);console.log('PASS '+label);}
async function main(){
 docker(['run','--rm','-d','--name',name,'-e','POSTGRES_PASSWORD','-p','127.0.0.1::5432','postgres:17']);started=true;
 const port=docker(['port',name,'5432/tcp']).split(':').at(-1);
 Object.assign(process.env,{NODE_ENV:'development',JWT_SECRET:randomBytes(32).toString('hex'),DB_HOST:'127.0.0.1',DB_PORT:port,DB_NAME:'postgres',DB_USER:'postgres',DB_PASSWORD:password,DB_SSL:'false',GEMINI_ENABLED:'false',QWEN_ENABLED:'false',WHATSAPP_ENABLED:'false',RECOVERY_ENABLED:'false'});
 pool=require('../database/conexao');
 for(let i=0;i<50;i++){try{await pool.query('SELECT 1');break;}catch{if(i===49)throw Error('PostgreSQL unavailable');await new Promise(r=>setTimeout(r,200));}}
 for(const file of ['schema.postgresql.sql','migrations/001_recuperacao_palavra_chave.sql','migrations/002_recuperacao_seguranca.sql','migrations/20261109_whatsapp.postgresql.sql','migrations/20261114_whatsapp_ia.postgresql.sql'])await pool.query(fs.readFileSync(path.join(backend,'database',file),'utf8'));
 check('schema e quatro migrações aplicados somente no container descartável',true);
 const express=require('express');const app=express();app.use(express.json({verify(req,_res,raw){req.rawBody=raw;}}));
 app.use('/api',require('../routes/loginRoutes'));app.use('/api/usuarios',require('../routes/usuariosRoutes'));app.use('/api/transacoes',require('../routes/transacoesRoutes'));
 const replies=[];let providerCalls=0;
 const {createQwen}=require('../assistant/qwen');const {createAssistant}=require('../assistant/service');
 const generate=createQwen({workspace:'fixture',model:'qwen-fixture',apiKey:'local-fixture-not-real'},async(_url,options)=>{
  providerCalls++;const input=JSON.parse(JSON.parse(options.body).messages[1].content);
  const question=input.mensagem.includes('?');
  const output=question?{kind:'answer',resposta:'O saldo considera todas as movimentações cadastradas.',fontes:['saldo-periodo']}
  :{kind:'draft',resposta:'',fontes:[],transacao:{descricao:'almoço de demonstração',valor:'25.90',tipo:'despesa',data:input.hoje,categoria:'Alimentação'}};
  return{ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(output)}}]})};
 });
 const config={appSecret:randomBytes(32).toString('hex'),verifyToken:'fixture',phoneNumberId:'123',timeZone:'America/Sao_Paulo'};
 app.use('/api/whatsapp',require('../whatsapp/routes').createWhatsAppRouter({config,repository:require('../whatsapp/repository').createRepository(pool, 'qwen'),authenticate:require('../middlewares/autenticar'),assistant:createAssistant(generate),aiProvider:'qwen',send:async(_phone,reply)=>{replies.push(reply);}}));
 server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});const base=`http://127.0.0.1:${server.address().port}/api`;
 async function request(route,method='GET',body,token){const r=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return{status:r.status,body:await r.json()};}
 async function webhook(id,text,signed=true){const body=JSON.stringify({object:'whatsapp_business_account',entry:[{changes:[{field:'messages',value:{metadata:{phone_number_id:'123'},messages:[{id,from:'5511999990000',type:'text',timestamp:String(Math.floor(Date.now()/1000)),text:{body:text}}]}}]}]});const r=await fetch(base+'/whatsapp/webhook',{method:'POST',body,headers:{'Content-Type':'application/json',...(signed?{'X-Hub-Signature-256':'sha256='+createHmac('sha256',config.appSecret).update(body).digest('hex')}:{})}});return r.status;}
 const users=[];
 for(let i=0;i<2;i++){const email=`qwen-${i}@example.invalid`;const senha=randomBytes(20).toString('hex');assert.equal((await request('/usuarios','POST',{nome:'Demonstração '+i,email,senha})).status,201);const login=await request('/login','POST',{email,senha});assert.equal(login.status,200);users.push(login.body);}
 const [a,b]=users;check('cadastro e login reais de duas contas isoladas',true);
 check('assinatura ausente recusada antes de processar',await webhook('invalid','resumo',false)===403);
 const link=await request('/whatsapp/vinculo','POST',{numero:'5511999990000'},a.token);assert.equal(link.status,201);
 await webhook('link',link.body.comando);check('vínculo real com código e JWT', (await request('/whatsapp/vinculo','GET',undefined,a.token)).body.vinculado);
 await pool.query("UPDATE whatsapp_links SET ai_consent_at=CURRENT_TIMESTAMP, ai_provider='gemini'");
 await webhook('no-consent','paguei vinte e cinco reais no almoço');check('consentimento antigo Gemini não autoriza Qwen',providerCalls===0);
 check('consentimento Qwen ainda ausente',(await pool.query("SELECT count(*) FROM whatsapp_links WHERE ai_provider='qwen'")).rows[0].count==='0');
 await webhook('consent','ia ativar');check('consentimento Qwen persistido',(await pool.query('SELECT ai_provider FROM whatsapp_links')).rows[0].ai_provider==='qwen');
 await webhook('proposal','paguei vinte e cinco reais e noventa no almoço');check('proposta sem gravação antes de confirmar',(await pool.query('SELECT count(*) FROM movimentacoes')).rows[0].count==='0');
 check('uma chamada pelo adaptador Qwen simulado',providerCalls===1);
 const code=/confirmar ([a-f0-9]{12})/.exec(replies.at(-1))[1];
 await webhook('proposal','paguei vinte e cinco reais e noventa no almoço');check('reentrega não repete IA',providerCalls===1);
 await webhook('wrong','confirmar 000000000000');check('código errado não grava',(await pool.query('SELECT count(*) FROM movimentacoes')).rows[0].count==='0');
 await webhook('confirm','confirmar '+code);await webhook('confirm','confirmar '+code);
 const records=await pool.query('SELECT valor::text,usuario_id FROM movimentacoes');check('confirmação e reentrega resultam em uma gravação exata',records.rowCount===1&&records.rows[0].valor==='25.90'&&records.rows[0].usuario_id===a.usuario.id);
 const result=await request('/transacoes','GET',undefined,a.token);check('API reflete despesa e saldo negativo',result.body.despesas===25.9&&result.body.saldo===-25.9);
 check('outra conta não vê a movimentação',(await request('/transacoes','GET',undefined,b.token)).body.transacoes.length===0);
 const load=require(path.join(mobileRoot,'tests/helpers/load-typescript.cjs')).createLoader({development:true});
 const dashboard=await load('src/services/dashboardService.ts').loadDashboard(base,a.token,new AbortController().signal);
 check('serviço real do Dashboard Mobile lê o lançamento persistido',dashboard.despesas===25.9);
 const web=await import(require('node:url').pathToFileURL(path.join(root,'src/services/financeData.js')));
 const normalized=web.normalizeTransacoesResponse(result.body);check('normalizador real do Web aceita os mesmos dados',Array.isArray(normalized)&&normalized.length===1);
 await webhook('rag','O saldo representa dinheiro disponível no banco?');check('RAG recupera fonte e produz resposta pelo adaptador Qwen',replies.at(-1).includes('Fontes: saldo-periodo'));
 await pool.query("UPDATE whatsapp_links SET ai_requests=12, ai_window_started=CURRENT_TIMESTAMP");const atLimit=providerCalls;await webhook('limit','paguei almoço novamente');check('cota persistida no PostgreSQL bloqueia chamada adicional',providerCalls===atLimit&&replies.at(-1).includes('Limite'));
 await webhook('off','ia desativar');const before=providerCalls;await webhook('after-off','paguei mais almoço');check('revogação impede chamada posterior',providerCalls===before);
 await request('/whatsapp/vinculo','DELETE',undefined,a.token);check('desvínculo remove acesso e mantém lançamento',(await pool.query('SELECT count(*) FROM whatsapp_links')).rows[0].count==='0'&&(await pool.query('SELECT count(*) FROM movimentacoes')).rows[0].count==='1');
 const output=path.join(root,'node_modules/.cache/qwen-rehearsal');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({date:new Date().toISOString(),checks,environment:'PostgreSQL 17 Docker loopback; HTTP/SQL reais; Meta e Qwen simulados; serviços Mobile e normalizador Web reais; sem UI'},null,2));
 console.log(`RESULTADO: ${checks.length} verificações aprovadas.`);
}
main().catch(error=>{console.error('TESTE FALHOU: '+error.message);process.exitCode=1;}).finally(async()=>{if(server)await new Promise(r=>server.close(r));if(pool)await pool.end();if(started){docker(['stop',name]);console.log('Container de teste removido; banco compartilhado não acessado.');}});
