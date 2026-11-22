// Only fixed labels and numeric codes may leave the signed status webhook.
// Never log the payload, message ID, recipient, provider text or credentials.
function deliveryFailures(body, phoneNumberId) {
  if (body?.object !== 'whatsapp_business_account') return [];
  const result = [];
  const categories = { 130497: 'country_restriction', 131031: 'account_restriction',
    131026: 'undeliverable', 131047: 'conversation_window', 131042: 'payment' };
  for (const entry of Array.isArray(body.entry) ? body.entry : []) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      const value = change?.value;
      if (change?.field !== 'messages' || value?.metadata?.phone_number_id !== phoneNumberId) continue;
      for (const status of Array.isArray(value.statuses) ? value.statuses : []) {
        if (status?.status !== 'failed') continue;
        const codes = new Set((Array.isArray(status.errors) ? status.errors : [])
          .map(error => error?.code).filter(code => Number.isSafeInteger(code) && code > 0));
        if (!codes.size) result.push({ event: 'whatsapp_delivery_failure', code: null, category: 'unknown' });
        for (const code of codes) result.push({ event: 'whatsapp_delivery_failure', code,
          category: Object.hasOwn(categories, code) ? categories[code] : 'unknown' });
      }
    }
  }
  return result;
}
module.exports = { deliveryFailures };
