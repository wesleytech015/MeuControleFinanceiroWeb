import api from "./api";

export function listarCartoes() {
  return api.get("/cartoes");
}

export function cadastrarCartao(dados) {
  return api.post("/cartoes", dados);
}

export function excluirCartao(id) {
  return api.delete(`/cartoes/${id}`);
}