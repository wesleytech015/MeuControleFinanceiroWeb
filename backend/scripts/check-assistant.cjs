require('../config/environment').loadEnvironment();
const { configuration: qwenConfiguration } = require('../assistant/qwen');
const { configuration: whatsappConfiguration } = require('../whatsapp/transport');
const configured = key => typeof process.env[key] === 'string' && !!process.env[key].trim();
const groups = {
  Qwen: ['QWEN_API_KEY', 'QWEN_MODEL', 'QWEN_WORKSPACE_ID'],
  WhatsApp: ['WHATSAPP_APP_SECRET', 'WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_GRAPH_VERSION'],
  Banco: ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'],
};
for (const [name, fields] of Object.entries(groups)) {
  console.log(name + ': ' + fields.map(key => key + '=' + (configured(key) ? 'configurado' : 'pendente')).join(', '));
}
for (const [name, check] of [['Qwen', qwenConfiguration], ['WhatsApp', whatsappConfiguration]]) {
  try { console.log(name + ': ' + (check() ? 'configuração ativa válida' : 'desabilitado')); }
  catch { console.log(name + ': configuração inválida; confira o guia privado'); process.exitCode = 1; }
}
console.log('Base RAG: ' + require('../assistant/knowledge.json').length + ' trechos locais.');
console.log('Não houve chamada externa nem conexão ao banco. Cota gratuita, migrações, webhook público e mensagens reais exigem validação separada.');
