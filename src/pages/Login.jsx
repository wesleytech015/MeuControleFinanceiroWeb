// Importa os hooks do React.
import { useRef, useState } from "react";

// Importa o Link para navegação entre páginas.
import { Link, useNavigate } from "react-router-dom";

// Importa a função de login da API.
import { login } from "../services/api";
import { notifyAuthChange } from "../services/authSession.js";
import { loginError } from "../services/loginError.js";
import { validateLogin } from "../services/loginValidation.js";

// Importa o CSS da página.
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();
  const loginPending = useRef(false);

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  // CONTROLA SE A TELA ESTÁ CARREGANDO
  const [carregando, setCarregando] = useState(false);

  // CONTROLA SE OS CAMPOS DEVEM FICAR VERMELHOS
  const [erroLogin, setErroLogin] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    if (loginPending.current) return;
    const validation = validateLogin(email, senha);
    if (validation) {
      setErro(validation);
      setErroLogin(true);
      return;
    }

    setErro("");
    setErroLogin(false);
    loginPending.current = true;
    setCarregando(true);

    try {
      const resposta = await login(email.trim(), senha);

      localStorage.setItem("token", resposta.token);

      localStorage.setItem(
        "usuario",
        JSON.stringify(resposta.usuario)
      );
      notifyAuthChange();

      navigate("/dashboard");
    } catch (error) {
      const feedback = loginError(error);
      setErro(feedback.message);
      setErroLogin(feedback.credentials);
    } finally {
      loginPending.current = false;
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-left" aria-labelledby="login-presentation-title">
        <div className="login-brand" aria-label="MeuControleFinanceiro"><span className="login-brand-mark" aria-hidden="true"><i /><i /><i /></span><span>MeuControle<span>Financeiro</span></span></div>
        <div className="login-presentation">
          <h1 id="login-presentation-title">Organize sua vida financeira em um <span>só lugar<svg viewBox="0 0 160 18" aria-hidden="true"><path d="M4 13Q80-2 155 10" /></svg></span></h1>
          <p>Acompanhe receitas, despesas, metas e evolução do seu orçamento de forma simples e inteligente.</p>
          <ul className="login-benefits">
            <li><span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 20v-6h3v6M11 20V9h3v11M18 20V3h3v17" /></svg></span>Controle seus gastos</li>
            <li><span aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="13" r="8" /><circle cx="11" cy="13" r="4" /><path d="m11 13 9-10m-4 0h4v4" /></svg></span>Defina metas financeiras</li>
            <li><span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M11 3a9 9 0 1 0 9 10h-9ZM14 2v8h8a9 9 0 0 0-8-8ZM14 13l6 6" /></svg></span>Acompanhe sua evolução</li>
          </ul>
        </div>
        <img className="login-illustration" src="/login-finance.svg" alt="" />
      </section>
      <section className="login-right" aria-labelledby="login-title">
        <div className="login-card">
          <h2 id="login-title">Bem-vindo de volta<span className="login-welcome-sparks" aria-hidden="true"><i /><i /><i /></span></h2>
          <p className="login-subtitle">Acesse sua conta e continue no controle das suas finanças.</p>
          {erro && <p className="erro-login" id="login-error" role="alert">{erro}</p>}
          <form noValidate onSubmit={handleLogin} aria-busy={carregando}>
            <label htmlFor="login-email"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></svg>E-mail</label>
            <input id="login-email" name="email" type="email" autoComplete="username" placeholder="Digite seu e-mail" value={email} className={erroLogin ? "input-erro" : ""} aria-invalid={erroLogin} aria-describedby={erro ? "login-error" : undefined} onChange={(e) => { setEmail(e.target.value); setErro(""); setErroLogin(false); }} />
            <label htmlFor="login-password"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>Senha</label>
            <div className="login-password-field">
              <input id="login-password" name="password" type={mostrarSenha ? "text" : "password"} autoComplete="current-password" placeholder="Digite sua senha" value={senha} className={erroLogin ? "input-erro" : ""} aria-invalid={erroLogin} aria-describedby={erro ? "login-error" : undefined} onChange={(e) => { setSenha(e.target.value); setErro(""); setErroLogin(false); }} />
              <button type="button" className="login-password-toggle" aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} aria-pressed={mostrarSenha} onClick={() => setMostrarSenha(!mostrarSenha)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{mostrarSenha && <path d="m3 3 18 18" />}</svg></button>
            </div>
            <button type="submit" className="login-button" disabled={carregando}>{carregando ? <span className="login-spinner" aria-hidden="true" /> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h5v18h-5M3 12h12m-5-5 5 5-5 5" /></svg>}{carregando ? "Entrando..." : "Entrar"}</button>
          </form>
          <div className="login-divider"><span>Ainda não tem conta?</span></div>
          <Link to="/cadastro" className="login-register"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="7" r="4" /><path d="M16 21H3v-3a7 7 0 0 1 11-5M19 13v8m-4-4h8" /></svg>Criar uma conta</Link>
        </div>
      </section>
    </main>
  );
}
export default Login;
