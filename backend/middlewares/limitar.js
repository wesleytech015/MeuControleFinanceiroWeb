const { rateLimit } = require('express-rate-limit');

// Conservative IP limits; trust proxy stays disabled until Render topology is verified.
function limit(max) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { erro: 'Muitas tentativas. Aguarde antes de tentar novamente.' }
  });
}
exports.login = limit(15);
exports.cadastro = limit(20);
