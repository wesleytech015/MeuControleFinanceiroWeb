const secret = process.env.JWT_SECRET;

// A missing configuration must stop startup, never select a publicly known secret.
if (typeof secret !== 'string' || Buffer.byteLength(secret.trim()) < 32) {
  throw new Error('Configure JWT_SECRET com pelo menos 32 bytes aleatórios.');
}

module.exports = { jwtSecret: secret };
