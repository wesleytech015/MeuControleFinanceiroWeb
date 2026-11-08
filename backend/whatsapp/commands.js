const { validateTransaction } = require('../validation/transacao');

const HELP = 'Use: despesa 15,00 frutas; receita 500 trabalho; resumo; cancelar. Opcional: | categoria=Alimentação | data=07/11/2026. Não envie senhas.';
function today(now = new Date(), timeZone = 'America/Sao_Paulo') {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = key => parts.find(item => item.type === key).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
function parseCommand(text, now = new Date(), timeZone = 'America/Sao_Paulo') {
  if (typeof text !== 'string' || !text.trim() || text.length > 600) throw new Error(HELP);
  const input = text.trim();
  if (/^(ajuda|resumo|cancelar)$/i.test(input)) return { kind: input.toLowerCase() };
  const link = /^vincular ([a-f0-9]{32})$/i.exec(input);
  if (link) return { kind: 'link', code: link[1].toLowerCase() };
  const confirmation = /^(?:confirmar|sim) ([a-f0-9]{12})$/i.exec(input);
  if (confirmation) return { kind: 'confirm', code: confirmation[1].toLowerCase() };
  const [main, ...options] = input.split('|').map(part => part.trim());
  const match = /^(despesa|compra|gastei|receita|recebi)\s+(?:R\$\s*)?(\d{1,13}(?:[,.]\d{1,2})?)\s+(?:reais\s+)?(?:com\s+)?(.+)$/i.exec(main);
  if (!match) throw new Error(HELP);
  let data = today(now, timeZone);
  let categoria = null;
  const seen = new Set();
  for (const option of options) {
    const pair = /^(categoria|data)=(.+)$/i.exec(option);
    if (!pair || seen.has(pair[1].toLowerCase())) throw new Error(HELP);
    const key = pair[1].toLowerCase();
    seen.add(key);
    if (key === 'categoria') categoria = pair[2].trim();
    else {
      const date = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(pair[2].trim());
      if (!date) throw new Error('Informe a data completa: DD/MM/AAAA.');
      data = `${date[3]}-${date[2]}-${date[1]}`;
    }
  }
  if (!categoria && /\b(frutas?|almo[çc]o|jantar|mercado|lanche)\b/i.test(match[3])) categoria = 'Alimentação';
  return { kind: 'draft', transaction: validateTransaction({
    tipo: /^(receita|recebi)$/i.test(match[1]) ? 'receita' : 'despesa',
    valor: match[2].replace(',', '.'), descricao: match[3], data, categoria, forma_pagamento: null,
  }) };
}
function money(decimal) {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(String(decimal));
  if (!match) throw new Error('Valor financeiro inválido.');
  return `${match[1]}R$ ${BigInt(match[2]).toLocaleString('pt-BR')},${(match[3] || '').padEnd(2, '0')}`;
}
function draftReply(draft, code) {
  const [year, month, day] = draft.data.split('-');
  return `Confirme ${draft.tipo}: ${money(draft.valor)}; ${draft.descricao}; ${day}/${month}/${year}; categoria: ${draft.categoria || 'sem categoria'}. Envie confirmar ${code} para salvar ou cancelar. Válido por 10 minutos.`;
}
module.exports = { HELP, parseCommand, today, money, draftReply };
