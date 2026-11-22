const {test}=require('node:test');
const assert=require('node:assert/strict');
const {configuration,createQwen}=require('../assistant/qwen');
test('Qwen requires explicit enable, model, key and safe workspace',()=>{
 assert.equal(configuration({}),null);
 assert.throws(()=>configuration({QWEN_ENABLED:'true'}));
 assert.throws(()=>configuration({QWEN_ENABLED:'true',QWEN_API_KEY:'fixture',QWEN_MODEL:'qwen-test',QWEN_WORKSPACE_ID:'host/evil'}));
});
test('Qwen uses private header, bounded JSON request and parses validated provider completion',async()=>{
 const generate=createQwen({workspace:'fixture',model:'qwen-test',apiKey:'private-fixture'},async(url,options)=>{
 assert.equal(url,'https://fixture.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions');
 assert.doesNotMatch(url,/private-fixture/);
 assert.equal(options.headers.Authorization,'Bearer private-fixture');
 const body=JSON.parse(options.body);assert.equal(body.enable_thinking,false);assert.equal(body.max_tokens,1024);assert.equal(body.response_format.type,'json_object');
 return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{"kind":"clarify"}'}}]})};
 });
 assert.deepEqual(await generate({system:'rules',input:{mensagem:'teste'}}),{kind:'clarify'});
});
test('quota, incomplete output and tool requests fail without exposing secrets or retrying',async()=>{
 for(const value of [{ok:false},{ok:true,data:{choices:[{finish_reason:'length'}]}},{ok:true,data:{choices:[{finish_reason:'stop',message:{tool_calls:[{}],content:'{}'}}]}}]){
 let calls=0;const generate=createQwen({workspace:'fixture',model:'qwen-test',apiKey:'private-fixture'},async()=>{calls++;return{ok:value.ok,json:async()=>value.data};});
 await assert.rejects(generate({system:'',input:{}}),e=>/indisponível/.test(e.message)&&!e.message.includes('private-fixture'));assert.equal(calls,1);
 }
});
