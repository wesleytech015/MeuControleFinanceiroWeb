const LIMIT = 5;
const MAX_AGE_MS = 15 * 60000;
function normalize(text) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
function sensitive(text) {
  return /\b(senha|password|token|jwt|api[_ -]?key|frase secreta)\b/i.test(text)
    || /AIza[\w-]+|eyJ[\w-]+\.[\w-]+\./.test(text);
}
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-LIMIT).filter(item => item && ['user', 'assistant'].includes(item.role)
    && typeof item.text === 'string' && item.text.trim() && !sensitive(item.text))
    .map(item => ({ role: item.role, text: item.text.trim().slice(0, item.role === 'user' ? 600 : 1200)
      .replace(/\b(?:confirmar|vincular|sim)\s+[a-f0-9]{12,32}\b/gi, '[confirmação pelo código recebido]') }));
}
function financialIntent(text) {
  return /\b(paguei|gastei|recebi|comprei|ganhei|desembolsei|registre|registrar|anote|anotar|lancar|lancamento|despesa|receita)\b/.test(normalize(text));
}
function continuation(text) {
  return /^(?:foi\b|era\b|o valor\b|o tipo\b|a data\b|a categoria\b|a descricao\b|valor\b|na verdade\b|corrig\w*\b|altere\b|mude\b|hoje\b|ontem\b|anteontem\b|categoria\b|data\b|descricao\b|tipo\b|r\$\s*\d|\d|vinte\b|trinta\b|quarenta\b|cinquenta\b|cem\b)/.test(normalize(text));
}
function outsidePriceQuestion(text) {
  const value = normalize(text);
  return /\b(qual|quanto|me diga|pesquise|procure|consulte|sabe|informe)\b/.test(value)
    && /\b(preco|custa|custam|cotacao|comprar|mais barato)\b/.test(value);
}
module.exports = { LIMIT, MAX_AGE_MS, normalize, sensitive, sanitizeHistory, financialIntent, continuation, outsidePriceQuestion };
