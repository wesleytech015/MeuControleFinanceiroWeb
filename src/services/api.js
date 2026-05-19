import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api"
});

export async function listarTransacoes() {
  const resposta = await api.get("/transacoes");
  return resposta.data;
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
