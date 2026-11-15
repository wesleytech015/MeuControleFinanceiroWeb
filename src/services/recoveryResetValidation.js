import { validateCadastro } from './cadastroValidation.js';

export function validateRecoveryReset(values) {
  const { email, palavraChave, novaSenha, confirmacao } = values;
  const passwordErrors = validateCadastro({ nome: 'Recuperação', email, senha: novaSenha, confirmacao });
  const errors = {};
  if (passwordErrors.email) errors.email = passwordErrors.email;
  if (passwordErrors.senha) errors.novaSenha = passwordErrors.senha;
  if (passwordErrors.confirmacao) errors.confirmacao = passwordErrors.confirmacao;
  if (!palavraChave) errors.palavraChave = 'Informe sua palavra-chave de recuperação.';
  else if (Array.from(palavraChave).length > 256) errors.palavraChave = 'A palavra-chave deve ter no máximo 256 caracteres.';
  if (novaSenha && novaSenha === palavraChave) errors.novaSenha = 'Escolha uma senha diferente da palavra-chave de recuperação.';
  return errors;
}
