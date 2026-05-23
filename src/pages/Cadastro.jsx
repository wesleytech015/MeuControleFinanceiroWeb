/* IMPORTAÇÃO DO CSS DA PÁGINA */
import "../styles/cadastro.css";

/* COMPONENTE DA PÁGINA DE CADASTRO */
function Cadastro() {

  /* RETORNO DA INTERFACE */
  return (

    /* CONTAINER PRINCIPAL */
    <div className="cadastro-page">

      {/* CARD CENTRAL */}
      <div className="cadastro-card">

        {/* TÍTULO */}
        <h1>Criar conta</h1>

        {/* SUBTÍTULO */}
        <p>
          Cadastre-se para controlar suas receitas e despesas
        </p>

        {/* FORMULÁRIO */}
        <form>

          {/* LABEL DO NOME */}
          <label>Nome</label>

          {/* CAMPO NOME */}
          <input
            type="text"
            placeholder="Digite seu nome"
          />

          {/* LABEL DO E-MAIL */}
          <label>E-mail</label>

          {/* CAMPO E-MAIL */}
          <input
            type="email"
            placeholder="Digite seu e-mail"
          />

          {/* LABEL DA SENHA */}
          <label>Senha</label>

          {/* CAMPO SENHA */}
          <input
            type="password"
            placeholder="Digite sua senha"
          />

          {/* BOTÃO CADASTRAR */}
          <button type="submit">
            Cadastrar
          </button>

        </form>

        {/* LINK PARA LOGIN */}
        <span>
          Já tem conta? <a href="/">Entrar</a>
        </span>

      </div>
    </div>
  );
}

/* EXPORTAÇÃO DO COMPONENTE */
export default Cadastro;