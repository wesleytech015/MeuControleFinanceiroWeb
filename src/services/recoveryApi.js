import { resolveApiUrl } from './apiUrl.js';
const API_URL = resolveApiUrl(import.meta.env?.VITE_API_URL, import.meta.env?.PROD);
const invalidRecovery = 'Não foi possível redefinir a senha. Confira os dados ou tente novamente mais tarde.';
const safeCodes = new Set(['RECOVERY_INVALID', 'RECOVERY_DISABLED', 'CURRENT_PASSWORD_INVALID', 'CURRENT_PASSWORD_REQUIRED',
  'RECOVERY_SECRET_INVALID', 'PASSWORD_EQUALS_RECOVERY', 'PASSWORD_REQUIRED', 'PASSWORD_TOO_SHORT', 'PASSWORD_TOO_LONG', 'PASSWORD_COMMON']);

class RecoveryApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = safeCodes.has(code) ? code : undefined;
  }
}

function responseMessage(status, code, settings) {
  if (status === 403) return 'A recuperação de senha está indisponível neste ambiente.';
  if (status === 429) return 'Muitas tentativas. Aguarde antes de tentar novamente.';
  if (settings && status === 401) return 'Sua sessão expirou. Entre novamente.';
  if (settings && status === 400) return code === 'CURRENT_PASSWORD_INVALID'
    ? 'A senha atual está incorreta.' : 'Confira os campos informados para configurar a recuperação.';
  if ([400, 401, 404].includes(status)) return invalidRecovery;
  return 'Não foi possível concluir a operação agora. Tente novamente mais tarde.';
}

async function request(path, body, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: token ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body), signal: controller.signal,
    });
    let data;
    try { data = await response.json(); } catch { /* Mantém o status de respostas sem JSON. */ }
    if (!response.ok) {
      // Mensagens do servidor podem conter dados da conta ou ecoar credenciais.
      // Exibe somente mensagens locais, sem registrar ou anexar o corpo à exceção.
      throw new RecoveryApiError(responseMessage(response.status, data?.codigo, Boolean(token)), response.status, data?.codigo);
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new RecoveryApiError('O servidor retornou uma resposta inválida.');
    return data;
  } catch (error) {
    if (controller.signal.aborted) throw new RecoveryApiError('O servidor demorou para responder. Confira o resultado antes de tentar novamente.');
    if (error instanceof RecoveryApiError) throw error;
    throw new RecoveryApiError('Não foi possível conectar ao servidor. Confira sua conexão.');
  } finally { clearTimeout(timeout); }
}

export function configurarPalavraChave(senhaAtual, palavraChave, token) {
  if (!token) return Promise.reject(new Error('Entre na sua conta para configurar a recuperação.'));
  return request('/usuarios/palavra-chave', { senhaAtual, palavraChave }, token);
}
export const redefinirPorPalavraChave = (email, palavraChave, novaSenha) => request('/recuperacao-senha', { email, palavraChave, novaSenha });
