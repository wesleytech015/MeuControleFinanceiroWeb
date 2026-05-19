import { Link } from "react-router-dom";
import "../styles/login.css";

function Login() {
  return (
    <div className="login-page">
      <section className="login-left">
        <div className="login-overlay">
          <h1>Meu Controle Financeiro</h1>
          <p>Organize suas receitas, despesas, metas e cartões em um só lugar.</p>
        </div>
      </section>

      <section className="login-right">
        <div className="login-card">
          <h2>Entrar</h2>
          <p className="login-subtitle">Acesse sua conta para continuar</p>

          <form>
            <label>E-mail</label>
            <input type="email" placeholder="seu@email.com" />

            <label>Senha</label>
            <input type="password" placeholder="Digite sua senha" />

            <Link className="login-button" to="/dashboard">
              Entrar
            </Link>
          </form>

          <p className="login-footer">
            Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Login;