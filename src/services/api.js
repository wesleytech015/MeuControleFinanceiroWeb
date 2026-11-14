import axios from "axios";
import { resolveApiUrl } from "./apiUrl.js";
import { clearAuthSession } from "./authSession.js";

// URL base do backend.
// Todas as requisições do frontend serão enviadas para esse endereço.
const API_URL = resolveApiUrl(
  import.meta.env?.VITE_API_URL,
  import.meta.env?.PROD,
);

// ============================================
// FUNÇÃO AUXILIAR: RETORNA O TOKEN SALVO
// ============================================
// Para que serve: pega o token JWT salvo no localStorage
// após o login e coloca no cabeçalho Authorization.
function getToken(required = false) {
  const token = localStorage.getItem("token");
  if (!token && required) {
    const error = new Error("Sua sessão expirou. Entre novamente.");
    error.status = 401;
    throw error;
  }
  return token;
}

async function requestTransacao(path, options = {}) {
  const token = getToken(true);
  const resposta = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (resposta.status === 401) {
    const error = new Error("Sua sessão expirou. Entre novamente.");
    error.status = 401;
    clearAuthSession({ error: error.message });
    throw error;
  }

  let body = null;
  try {
    body = await resposta.json();
  } catch {
    if (resposta.ok) {
      throw new Error("A API retornou uma resposta inválida.");
    }
  }

  if (!resposta.ok) {
    const error = new Error(
      body?.erro || `Erro na API (${resposta.status}).`,
    );
    error.status = resposta.status;
    throw error;
  }

  return body;
}

// Cliente usado pelos serviços que consomem a interface Axios.
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// ============================================
// LOGIN
// ============================================
// Função responsável por fazer login do usuário.
export async function login(email, senha) {
  // Controlador exclusivo desta tentativa, sem afetar outras operações.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const resposta = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
      signal: controller.signal,
    });
    if (!resposta.ok) {
      const error = new Error("Erro ao fazer login");
      error.status = resposta.status;
      throw error;
    }
    return await resposta.json();
  } catch (error) {
    if (controller.signal.aborted) {
      const timeoutError = new Error("Tempo limite do login excedido.");
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================
// CADASTRO
// ============================================
// Função responsável por cadastrar um novo usuário.
export async function cadastrar(nome, email, senha, palavraChave) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const resposta = await fetch(`${API_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha, ...(palavraChave === undefined ? {} : { palavraChave }) }),
      signal: controller.signal,
    });
    let body;
    try {
      body = await resposta.json();
    } catch {
      if (resposta.ok) throw new Error("A API retornou uma resposta inválida.");
    }
    if (!resposta.ok) {
      const error = new Error(typeof body?.erro === "string" ? body.erro : "Erro ao cadastrar usuário");
      error.status = resposta.status;
      error.code = typeof body?.codigo === "string" ? body.codigo : undefined;
      throw error;
    }
    return body;
  } catch (error) {
    if (controller.signal.aborted) {
      const timeoutError = new Error("Tempo limite do cadastro excedido.");
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================
// LISTAR TRANSAÇÕES (NOVO)
// ============================================
// Para que serve: busca todas as transações do usuário logado.
// O backend já separa por usuario_id usando o token JWT.
// Retorna: { saldo, receitas, despesas, transacoes: [] }
export async function listarTransacoes() {
  return requestTransacao("/transacoes", { method: "GET" });
}

// ============================================
// CRIAR TRANSAÇÃO (NOVO)
// ============================================
// Para que serve: envia uma nova transação para o banco.
// O backend vincula automaticamente ao usuário logado pelo token.
// Parâmetro dados: { descricao, valor, tipo, data, categoria, forma_pagamento }
// tipo deve ser 'receita' ou 'despesa' (letras minúsculas).
export async function criarTransacao(dados) {
  return requestTransacao("/transacoes", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

// ============================================
// EDITAR TRANSAÇÃO (NOVO)
// ============================================
// Para que serve: atualiza uma transação existente no banco.
// O backend valida que a transação pertence ao usuário logado.
// Parâmetro id: id da transação a ser editada.
// Parâmetro dados: { descricao, valor, tipo, data, categoria, forma_pagamento }
export async function editarTransacao(id, dados) {
  return requestTransacao(`/transacoes/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

// ============================================
// DELETAR TRANSAÇÃO (NOVO)
// ============================================
// Para que serve: remove uma transação do banco pelo id.
// O backend valida que a transação pertence ao usuário logado.
// Parâmetro id: id da transação a ser removida.
export async function deletarTransacao(id) {
  return requestTransacao(`/transacoes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
