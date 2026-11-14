const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const policy = require('../config/recoveryPolicy.json');

function validateSecret(value, { nome = '', email = '', senha = '' } = {}) {
  if (typeof value !== 'string' || !value.trim()) return policy.required;
  if (Array.from(value.trim()).length < policy.minLength) return policy.short;
  if (Array.from(value).length > policy.maxLength) return policy.long;
  const normalize = text => text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
  const normalized = normalize(value);
  const words = normalized.split(' ');
  if (policy.common.includes(normalized) || /^(.)\1+$/u.test(normalized)
    || !/\p{L}/u.test(normalized) || (words.length > 1 && new Set(words).size === 1)
    || [nome, email, email.split('@')[0], senha].filter(Boolean).some(text => normalize(text) === normalized)) return policy.weak;
  return '';
}

// O pré-hash limita a entrada do bcrypt a 44 bytes sem truncar frases Unicode.
const prehash = value => crypto.createHash('sha256').update('recovery-secret:v1\0').update(value, 'utf8').digest('base64');
const hashSecret = value => bcrypt.hash(prehash(value), 10);
const compareSecret = (value, hash) => bcrypt.compare(prehash(value), hash);

module.exports = { validateSecret, hashSecret, compareSecret };
