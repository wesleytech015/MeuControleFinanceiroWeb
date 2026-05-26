// URL base do backend.
// Todas as requisições do frontend serão enviadas para esse endereço.
const API_URL = "http://localhost:3000/api";

// Função responsável por fazer login do usuário.
export async function login(email, senha) {
  // Envia os dados de login para a rota /api/login do backend.
  const resposta = await fetch(`${API_URL}/login`, {
    method: "POST", // Define que estamos enviando dados.
    headers: {
      "Content-Type": "application/json", // Informa que os dados estão em JSON.
    },
    body: JSON.stringify({
      email: email, // E-mail digitado pelo usuário.
      senha: senha, // Senha digitada pelo usuário.
    }),
  });

  // Se o backend retornar erro, interrompe o login.
  if (!resposta.ok) {
    throw new Error("Erro ao fazer login");
  }

  // Retorna os dados enviados pelo backend.
  return await resposta.json();
}

// Função responsável por cadastrar um novo usuário.
export async function cadastrar(nome, email, senha) {
  // Envia os dados do cadastro para a rota /api/usuarios do backend.
  const resposta = await fetch(`${API_URL}/usuarios`, {
    method: "POST", // Define que estamos criando um novo registro.
    headers: {
      "Content-Type": "application/json", // Informa que o corpo da requisição está em JSON.
    },
    body: JSON.stringify({
      nome: nome, // Nome digitado no formulário.
      email: email, // E-mail digitado no formulário.
      senha: senha, // Senha digitada no formulário.
    }),
  });

  // Se o backend retornar erro, interrompe o cadastro.
  if (!resposta.ok) {
    throw new Error("Erro ao cadastrar usuário");
  }

  // Retorna a resposta do backend.
  return await resposta.json();
}