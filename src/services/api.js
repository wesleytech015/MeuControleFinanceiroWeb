// URL base do backend.
// Todas as requisições do frontend serão enviadas para esse endereço.
const API_URL = "http://localhost:3000/api";

// ============================================
// FUNÇÃO AUXILIAR: RETORNA O TOKEN SALVO
// ============================================
// Para que serve: pega o token JWT salvo no localStorage
// após o login e coloca no cabeçalho Authorization.
function getToken() {
  return localStorage.getItem("token");
}

// ============================================
// LOGIN
// ============================================
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

// ============================================
// CADASTRO
// ============================================
// Função responsável por cadastrar um novo usuário.
export async function cadastrar(nome, email, senha) {
  // Envia os dados do cadastro para a rota /api/usuarios do backend.
  const resposta = await fetch(`${API_URL}/usuarios`, {
    method: "POST", // Define que estamos criando um novo registro.
    headers: {
      "Content-Type": "application/json", // Informa que o corpo da requisição está em JSON.
    },
    body: JSON.stringify({
      nome: nome,   // Nome digitado no formulário.
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

// ============================================
// LISTAR TRANSAÇÕES (NOVO)
// ============================================
// Para que serve: busca todas as transações do usuário logado.
// O backend já separa por usuario_id usando o token JWT.
// Retorna: { saldo, receitas, despesas, transacoes: [] }
export async function listarTransacoes() {
  const resposta = await fetch(`${API_URL}/transacoes`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Envia o token JWT para o backend identificar o usuário.
      Authorization: `Bearer ${getToken()}`,
    },
  });

  // Se o token expirou ou é inválido, redireciona para o login.
  if (resposta.status === 401) {
    localStorage.clear();
    window.location.href = "/";
    return;
  }

  if (!resposta.ok) {
    throw new Error("Erro ao listar transações");
  }

  return await resposta.json();
}

// ============================================
// CRIAR TRANSAÇÃO (NOVO)
// ============================================
// Para que serve: envia uma nova transação para o banco.
// O backend vincula automaticamente ao usuário logado pelo token.
// Parâmetro dados: { descricao, valor, tipo, data, categoria, forma_pagamento }
// tipo deve ser 'receita' ou 'despesa' (letras minúsculas).
export async function criarTransacao(dados) {
  const resposta = await fetch(`${API_URL}/transacoes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Envia o token JWT para o backend identificar o usuário.
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(dados),
  });

  if (resposta.status === 401) {
    localStorage.clear();
    window.location.href = "/";
    return;
  }

  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.erro || "Erro ao criar transação");
  }

  return await resposta.json();
}

// ============================================
// EDITAR TRANSAÇÃO (NOVO)
// ============================================
// Para que serve: atualiza uma transação existente no banco.
// O backend valida que a transação pertence ao usuário logado.
// Parâmetro id: id da transação a ser editada.
// Parâmetro dados: { descricao, valor, tipo, data, categoria, forma_pagamento }
export async function editarTransacao(id, dados) {
  const resposta = await fetch(`${API_URL}/transacoes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      // Envia o token JWT para o backend identificar o usuário.
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(dados),
  });

  if (resposta.status === 401) {
    localStorage.clear();
    window.location.href = "/";
    return;
  }

  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.erro || "Erro ao editar transação");
  }

  return await resposta.json();
}

// ============================================
// DELETAR TRANSAÇÃO (NOVO)
// ============================================
// Para que serve: remove uma transação do banco pelo id.
// O backend valida que a transação pertence ao usuário logado.
// Parâmetro id: id da transação a ser removida.
export async function deletarTransacao(id) {
  const resposta = await fetch(`${API_URL}/transacoes/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      // Envia o token JWT para o backend identificar o usuário.
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (resposta.status === 401) {
    localStorage.clear();
    window.location.href = "/";
    return;
  }

  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.erro || "Erro ao deletar transação");
  }

  return await resposta.json();
}
