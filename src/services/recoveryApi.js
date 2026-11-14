import { resolveApiUrl } from './apiUrl.js';
const API_URL = resolveApiUrl(import.meta.env?.VITE_API_URL, import.meta.env?.PROD);

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
      const error = new Error(data?.erro || 'Não foi possível concluir a operação agora.');
      error.status = response.status;
      error.code = data?.codigo;
      throw error;
    }
    if (!data) throw new Error('O servidor retornou uma resposta inválida.');
    return data;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('O servidor demorou para responder. Confira o resultado antes de tentar novamente.', { cause: error });
    if (error instanceof TypeError) throw new Error('Não foi possível conectar ao servidor. Confira sua conexão.', { cause: error });
    throw error;
  } finally { clearTimeout(timeout); }
}

export function configurarPalavraChave(senhaAtual, palavraChave, token) {
  if (!token) return Promise.reject(new Error('Entre na sua conta para configurar a recuperação.'));
  return request('/usuarios/palavra-chave', { senhaAtual, palavraChave }, token);
}
export const redefinirPorPalavraChave = (email, palavraChave, novaSenha) => request('/recuperacao-senha', { email, palavraChave, novaSenha });
