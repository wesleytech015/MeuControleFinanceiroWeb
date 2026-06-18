// Importa os hooks do React.
import { useState } from "react";

// Importa o Link para navegação entre páginas.
import { Link, useNavigate } from "react-router-dom";

// Importa a função de login da API.
import { login } from "../services/api";

// Importa o CSS da página.
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  // CONTROLA SE A TELA ESTÁ CARREGANDO
  const [carregando, setCarregando] = useState(false);

  // CONTROLA SE OS CAMPOS DEVEM FICAR VERMELHOS
  const [erroLogin, setErroLogin] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setErro("");
    setErroLogin(false);
    setCarregando(true);

    try {
      const resposta = await login(email, senha);

      localStorage.setItem("token", resposta.token);

      localStorage.setItem(
        "usuario",
        JSON.stringify(resposta.usuario)
      );

      navigate("/dashboard");
    } catch (error) {
      setErro("E-mail ou senha inválidos.");
      setErroLogin(true);

      console.error(error);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      {carregando && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Entrando...</p>
        </div>
      )}

      <section className="login-left">
        <div className="login-overlay">
          <h1>Meu Controle Financeiro</h1>

          <p>
            Organize suas receitas, despesas,
            metas e cartões em um só lugar.
          </p>
        </div>
      </section>

      <section className="login-right">
        <div className="login-card">
          <h2>Entrar</h2>

          <p className="login-subtitle">
            Acesse sua conta para continuar
          </p>

          {erro && <p className="erro-login">{erro}</p>}

          <form onSubmit={handleLogin}>
            <label>E-mail</label>

            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              className={erroLogin ? "input-erro" : ""}
              onChange={(e) => {
                setEmail(e.target.value);
                setErro("");
                setErroLogin(false);
              }}
            />

            <label>Senha</label>

            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              className={erroLogin ? "input-erro" : ""}
              onChange={(e) => {
                setSenha(e.target.value);
                setErro("");
                setErroLogin(false);
              }}
            />

            <button
              type="submit"
              className="login-button"
              disabled={carregando}
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>

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

export default Login;