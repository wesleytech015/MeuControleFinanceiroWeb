// Importa os hooks do React.
import { useState } from "react";

// Importa o Link para navegação entre páginas.
import { Link, useNavigate } from "react-router-dom";

// Importa a função de login da API.
import { login } from "../services/api";

// Importa o CSS da página.
import "../styles/login.css";

function Login() {

  // Hook responsável pela navegação entre páginas.
  const navigate = useNavigate();

  // Estado que armazena o e-mail digitado.
  const [email, setEmail] = useState("");

  // Estado que armazena a senha digitada.
  const [senha, setSenha] = useState("");

  // Estado responsável por exibir mensagens de erro.
  const [erro, setErro] = useState("");

  // Função executada quando o formulário é enviado.
  async function handleLogin(event) {

    // Impede o recarregamento da página.
    event.preventDefault();

    try {

      // Chama a função login da API enviando email e senha.
      const resposta = await login(email, senha);

      // Salva o token retornado pelo backend.
      localStorage.setItem("token", resposta.token);

      // Salva os dados do usuário.
      localStorage.setItem(
        "usuario",
        JSON.stringify(resposta.usuario)
      );

      // Redireciona para o dashboard.
      navigate("/dashboard");

    } catch (error) {

      // Exibe mensagem de erro caso o login falhe.
      setErro("E-mail ou senha inválidos.");

      console.error(error);
    }
  }

  return (

    // Container principal da página.
    <div className="login-page">

      {/* LADO ESQUERDO */}
      <section className="login-left">

        <div className="login-overlay">

          <h1>Meu Controle Financeiro</h1>

          <p>
            Organize suas receitas, despesas,
            metas e cartões em um só lugar.
          </p>

        </div>

      </section>

      {/* LADO DIREITO */}
      <section className="login-right">

        <div className="login-card">

          <h2>Entrar</h2>

          <p className="login-subtitle">
            Acesse sua conta para continuar
          </p>

          {/* Exibe erro caso exista */}
          {erro && (
            <p className="erro-login">
              {erro}
            </p>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin}>

            {/* Campo de e-mail */}
            <label>E-mail</label>

            <input
              type="email"
              placeholder="seu@email.com"

              // Valor do input.
              value={email}

              // Atualiza o estado ao digitar.
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            {/* Campo de senha */}
            <label>Senha</label>

            <input
              type="password"
              placeholder="Digite sua senha"

              // Valor do input.
              value={senha}

              // Atualiza o estado ao digitar.
              onChange={(e) =>
                setSenha(e.target.value)
              }
            />

            {/* Botão de login */}
            <button
              type="submit"
              className="login-button"
            >
              Entrar
            </button>

          </form>

          {/* Link para cadastro */}
          <p className="login-footer">

            Ainda não tem conta?

            <Link to="/cadastro">
              Criar conta
            </Link>

          </p>

        </div>

      </section>

    </div>
  );
}

// Exporta o componente.
export default Login;