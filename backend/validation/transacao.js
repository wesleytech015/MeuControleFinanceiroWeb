function text(value, max, optional = false) {
  if (optional && (value === undefined || value === null)) return null;
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new Error(`Informe texto válido com até ${max} caracteres.`);
  }
  return value.trim();
}

function amount(value) {
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Valor monetário inválido.');
  const decimal = String(value);
  // Validate before conversion: Number(true) and Number([1]) would accept invalid input.
  // Keep DECIMAL(15,2) as a string so MySQL receives the exact cents without rounding.
  if (!/^\d{1,13}(?:\.\d{1,2})?$/.test(decimal)) throw new Error('Use um valor positivo com até duas casas decimais.');
  const [whole, fraction = ''] = decimal.split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (cents <= 0n || cents > 999999999999999n) throw new Error('Valor fora do limite permitido.');
  return `${BigInt(whole)}.${fraction.padEnd(2, '0')}`;
}

function date(value) {
  if (value === undefined) return new Date().toISOString().slice(0, 10);
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1000) throw new Error('Use uma data válida no formato AAAA-MM-DD.');
  const parsed = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error('Data de calendário inválida.');
  return value;
}

function validateTransaction(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Movimentação inválida.');
  if (!['receita', 'despesa'].includes(body.tipo)) throw new Error('Tipo deve ser receita ou despesa.');
  return {
    descricao: text(body.descricao, 200), tipo: body.tipo, valor: amount(body.valor), data: date(body.data),
    categoria: text(body.categoria, 100, true), forma_pagamento: text(body.forma_pagamento, 50, true),
  };
}

module.exports = { validateTransaction };
