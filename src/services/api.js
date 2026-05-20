import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api"
});

// Injeta o token em toda requisição automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redireciona para login se token expirar
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "/";
    }
    return Promise.reject(erro);
  }
);

// Auth
export async function login(email, senha) {
  const resposta = await api.post("/login", { email, senha });
  return resposta.data; // { token, usuario }
}

export async function cadastrar(nome, email, senha) {
  const resposta = await api.post("/usuarios", { nome, email, senha });
  return resposta.data;
}

// Transações
export async function listarTransacoes() {
  const resposta = await api.get("/transacoes");
  return resposta.data; // { saldo, receitas, despesas, transacoes[] }
}

export async function criarTransacao(transacao) {
  const resposta = await api.post("/transacoes", transacao);
  return resposta.data;
}

export async function deletarTransacao(id) {
  const resposta = await api.delete(`/transacoes/${id}`);
  return resposta.data;
}

export default api;
