const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const email = (value) => text(value, 100) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const password = (value) => typeof value === 'string' && value.length > 0 && Buffer.byteLength(value, 'utf8') <= 72;
const reject = (res) => res.status(400).json({ erro: 'Confira os campos informados.' });
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);

exports.login = (req, res, next) => {
  if (!object(req.body) || !email(req.body.email) || !password(req.body.senha)) return reject(res);
  next();
};
exports.cadastro = (req, res, next) => {
  if (!object(req.body) || !text(req.body.nome, 100) || !email(req.body.email)
    || !password(req.body.senha) || req.body.senha.length < 8) return reject(res);
  next();
};
exports.id = (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id))) return reject(res);
  next();
};
exports.transacao = (req, res, next) => {
  const body = req.body;
  if (!object(body) || !text(body.descricao, 200) || !['receita', 'despesa'].includes(body.tipo)) return reject(res);
  if (!['string', 'number'].includes(typeof body.valor)) return reject(res);
  const amount = String(body.valor);
  if (!/^\d{1,13}(\.\d{1,2})?$/.test(amount) || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return reject(res);
  if (body.data !== undefined) {
    if (typeof body.data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.data)) return reject(res);
    const date = new Date(body.data + 'T00:00:00.000Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== body.data) return reject(res);
  }
  for (const [key, max] of [['categoria', 100], ['forma_pagamento', 50]]) {
    if (body[key] != null && !text(body[key], max)) return reject(res);
  }
  next();
};
