export function loginError(error) {
  if (error?.name === 'TimeoutError') return { message: 'O servidor demorou para responder. Tente novamente.', credentials: false };
  if (error?.status === 401) return { message: 'E-mail ou senha inválidos.', credentials: true };
  if (error?.status === 429) return { message: 'Muitas tentativas. Aguarde antes de tentar novamente.', credentials: false };
  if (error instanceof TypeError) return { message: 'Não foi possível conectar ao servidor. Confira sua conexão e tente novamente.', credentials: false };
  return { message: 'Não foi possível entrar agora. Tente novamente em instantes.', credentials: false };
}
