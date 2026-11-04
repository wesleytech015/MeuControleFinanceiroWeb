function credentials(req, res, next) {
  const { email, senha } = req.body || {};
  if (typeof email !== 'string' || !email.trim() || email.trim().length > 100
    || typeof senha !== 'string' || !senha || Buffer.byteLength(senha, 'utf8') > 72) {
    return res.status(400).json({ erro: 'Informe e-mail e senha válidos (senha com até 72 bytes).' });
  }
  req.body.email = email.trim();
  next();
}

function registration(req, res, next) {
  const { nome, email, senha } = req.body || {};
  // bcrypt considers only 72 bytes; reject longer passwords instead of silently truncating them.
  if (typeof nome !== 'string' || !nome.trim() || nome.trim().length > 100
    || typeof email !== 'string' || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    || typeof senha !== 'string' || senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) {
    return res.status(400).json({ erro: 'Informe nome, e-mail e senha de 8 caracteres a 72 bytes.' });
  }
  req.body.nome = nome.trim(); req.body.email = email.trim();
  next();
}

module.exports = { credentials, registration };
