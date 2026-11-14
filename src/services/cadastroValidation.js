import passwordPolicy from '../../backend/config/cadastroPassword.json' with { type: 'json' };

const passwordErrors = passwordPolicy.errors;
const errorFields = {
  PASSWORD_REQUIRED: 'senha', PASSWORD_TOO_SHORT: 'senha', PASSWORD_TOO_LONG: 'senha', PASSWORD_COMMON: 'senha',
  NAME_INVALID: 'nome', EMAIL_INVALID: 'email', EMAIL_EXISTS: 'email',
};

export function cadastroErrorField(error) {
  if (error?.status === 409) return 'email';
  return error?.status === 400 ? errorFields[error.code] : undefined;
}

export function validateCadastro({ nome, email, senha, confirmacao }) {
  const errors = {};
  if (!nome.trim()) errors.nome = 'Informe seu nome.';
  else if (nome.trim().length > 100) errors.nome = 'O nome deve ter no máximo 100 caracteres.';
  if (!email.trim()) errors.email = 'Informe seu e-mail.';
  else if (email.trim().length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Informe um e-mail válido com até 100 caracteres.';
  }
  if (!senha) errors.senha = passwordErrors.PASSWORD_REQUIRED;
  else if (senha.length < passwordPolicy.minLength) errors.senha = passwordErrors.PASSWORD_TOO_SHORT;
  else if (new TextEncoder().encode(senha).length > passwordPolicy.maxBytes) errors.senha = passwordErrors.PASSWORD_TOO_LONG;
  else if (passwordPolicy.common.includes(senha.toLowerCase())) errors.senha = passwordErrors.PASSWORD_COMMON;
  if (!confirmacao) errors.confirmacao = 'Confirme sua senha.';
  else if (senha !== confirmacao) errors.confirmacao = 'As senhas não coincidem.';
  return errors;
}

export function cadastroError(error) {
  if (error?.status === 409) return 'Este e-mail já está cadastrado.';
  if (error?.status === 429) return 'Muitas tentativas. Aguarde antes de tentar novamente.';
  if (error?.status === 400) return passwordErrors[error.code] || error.message || 'Confira os campos informados.';
  if (error?.name === 'TimeoutError') return 'O servidor demorou para responder. Verifique se a conta foi criada antes de tentar novamente.';
  if (error instanceof TypeError) return 'Não foi possível conectar ao servidor. Confira sua conexão e tente novamente.';
  return 'Não foi possível criar sua conta agora. Tente novamente em instantes.';
}
