const { createHmac, timingSafeEqual } = require('node:crypto');
function equal(left, right) {
  return typeof left === 'string' && typeof right === 'string' && Buffer.byteLength(left) === Buffer.byteLength(right)
    && timingSafeEqual(Buffer.from(left), Buffer.from(right));
}
function validSignature(raw, header, secret) {
  return Buffer.isBuffer(raw) && equal(header, `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`);
}
function configuration(env = process.env) {
  if (env.WHATSAPP_ENABLED !== 'true') return null;
  for (const key of ['WHATSAPP_APP_SECRET', 'WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_GRAPH_VERSION']) {
    if (typeof env[key] !== 'string' || !env[key].trim()) throw new Error(`Configure ${key} no servidor.`);
  }
  if (!/^\d+$/.test(env.WHATSAPP_PHONE_NUMBER_ID) || !/^v\d+\.\d+$/.test(env.WHATSAPP_GRAPH_VERSION)) throw new Error('Configuração WhatsApp inválida.');
  const timeZone = env.WHATSAPP_TIMEZONE || 'America/Sao_Paulo';
  new Intl.DateTimeFormat('pt-BR', { timeZone }).format();
  return { appSecret: env.WHATSAPP_APP_SECRET, verifyToken: env.WHATSAPP_VERIFY_TOKEN,
    accessToken: env.WHATSAPP_ACCESS_TOKEN, phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    version: env.WHATSAPP_GRAPH_VERSION, timeZone };
}
function messages(body, phoneNumberId) {
  if (body?.object !== 'whatsapp_business_account') return [];
  const found = [];
  for (const entry of Array.isArray(body.entry) ? body.entry : []) {
    for (const change of Array.isArray(entry.changes) ? entry.changes : []) {
      const value = change.value;
      if (change.field !== 'messages' || value?.metadata?.phone_number_id !== phoneNumberId) continue;
      for (const message of Array.isArray(value.messages) ? value.messages : []) {
        if (message.type !== 'text' || typeof message.text?.body !== 'string' || !/^\d{10,15}$/.test(message.from)
          || typeof message.id !== 'string' || !message.id.length || message.id.length > 191 || !/^\d+$/.test(message.timestamp)) continue;
        found.push({ id: message.id, from: message.from, text: message.text.body, timestamp: message.timestamp });
      }
    }
  }
  return found;
}
function createSender(config, request = fetch) {
  return async (to, text) => {
    const response = await request(`https://graph.facebook.com/${config.version}/${config.phoneNumberId}/messages`, {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
    });
    if (!response.ok) throw new Error('Não foi possível entregar a resposta pelo WhatsApp.');
    const result = await response.json();
    if (typeof result.messages?.[0]?.id !== 'string') throw new Error('O WhatsApp não confirmou o envio.');
  };
}
module.exports = { equal, validSignature, configuration, messages, createSender };
