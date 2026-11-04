const { rateLimit } = require('express-rate-limit');

function createAuthLimiter(limit = 30) {
  return rateLimit({
    windowMs: 15 * 60 * 1000, limit, skipSuccessfulRequests: true,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { erro: 'Muitas tentativas. Aguarde e tente novamente.' },
  });
}

// Share the budget across login and registration. Keep trust proxy disabled unless
// deployment specifies trusted proxies; blindly trusting X-Forwarded-For bypasses IP limits.
module.exports = { createAuthLimiter, authLimiter: createAuthLimiter() };
