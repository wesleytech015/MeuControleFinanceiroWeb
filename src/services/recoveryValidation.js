import policy from '../../backend/config/recoveryPolicy.json' with { type: 'json' };

export function validateRecoverySecret(value, { nome = '', email = '', senha = '' } = {}) {
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

export function validateRecoveryFields(values) {
  const errors = {};
  const message = validateRecoverySecret(values.palavraChave, values);
  if (message) errors.palavraChave = message;
  if (!values.confirmacaoPalavra) errors.confirmacaoPalavra = 'Confirme sua palavra-chave de recuperação.';
  else if (values.palavraChave !== values.confirmacaoPalavra) errors.confirmacaoPalavra = policy.confirmation;
  return errors;
}
