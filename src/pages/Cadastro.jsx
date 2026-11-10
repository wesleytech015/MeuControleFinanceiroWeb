// Importa o hook useState do React.
import { useState } from "react";

// Importa Link e useNavigate para navegação entre páginas.
import { Link, useNavigate } from "react-router-dom";

// Importa a função cadastrar que está no arquivo api.js.
import { cadastrar } from "../services/api";

// Importa o CSS da tela de cadastro.
import "../styles/cadastro.css";

function Cadastro() {
  // Permite redirecionar o usuário para outra página.
  const navigate = useNavigate();

  // Estado que armazena o nome digitado.
  const [nome, setNome] = useState("");

  // Estado que armazena o e-mail digitado.
  const [email, setEmail] = useState("");

  // Estado que armazena a senha digitada.
  const [senha, setSenha] = useState("");

  // Estado para exibir mensagens de erro.
  const [erro, setErro] = useState("");

  // Função executada ao enviar o formulário.
  async function handleCadastro(event) {
    // Impede a página de recarregar.
    event.preventDefault();

    try {
      // Envia nome, email e senha para o backend.
      await cadastrar(nome, email, senha);

      // Exibe mensagem de sucesso.
      alert("Conta criada com sucesso!");

      // Redireciona para a tela de login.
      navigate("/");
    } catch (error) {
      // Exibe erro caso o cadastro falhe.
      setErro("Erro ao criar conta. Verifique os dados.");

      // Mostra o erro no console.
      console.error(error);
    }
  }

  return (
    <div className="cadastro-page">
      <div className="cadastro-card">
        <h1>Criar conta</h1>

        <p>Cadastre-se para controlar suas finanças.</p>

        {erro && <p className="erro-cadastro">{erro}</p>}

        <form onSubmit={handleCadastro}>
          <label>Nome</label>
          <input
            type="text"
            placeholder="Digite seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <label>E-mail</label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Senha</label>
          <input
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <button type="submit">
            Cadastrar
          </button>
        </form>

        <p className="cadastro-footer">
          Já tem conta?
          <Link to="/"> Entrar</Link>
        </p>
      </div>
    </div>
  );
}

export default Cadastro;