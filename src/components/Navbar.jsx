// COMPONENTE DA NAVBAR (BARRA SUPERIOR)

function Navbar() {

  // RECUPERA DADOS DO USUÁRIO LOGADO
  const usuario = JSON.parse(localStorage.getItem("usuario")) || {};

  // DEFINE O NOME EXIBIDO
  const nomeUsuario = usuario.nome || "Usuário";

  // PEGA A PRIMEIRA LETRA DO NOME
  const inicialUsuario = nomeUsuario.charAt(0).toUpperCase();

  // FUNÇÃO RESPONSÁVEL POR FAZER LOGOUT
  const sair = () => {

    // LIMPA DADOS SALVOS NO NAVEGADOR
    localStorage.clear();

    // REDIRECIONA PARA A TELA DE LOGIN
    window.location.href = "/";
  };

  return (

    // CABEÇALHO SUPERIOR
    <header className="navbar">

      {/* ÁREA DO TÍTULO */}
      <div>

        {/* TÍTULO PRINCIPAL */}
        <h3>Controle Financeiro</h3>

        {/* SUBTÍTULO */}
        <p>
          Gerencie suas finanças de forma simples
        </p>

      </div>

      {/* ÁREA DIREITA DA NAVBAR */}
      <div className="navbar-actions">

        {/* USUÁRIO LOGADO */}
        <div className="navbar-user">

          <div className="user-badge">

            {/* AVATAR */}
            <div className="user-avatar">
              {inicialUsuario}
            </div>

            {/* DADOS DO USUÁRIO */}
            <div className="user-info">

              <small>
                Usuário
              </small>

              <span>
                {nomeUsuario}
              </span>

            </div>

          </div>

        </div>

        {/* BOTÃO SAIR */}
        <button
          className="btn-sair"
          onClick={sair}
        >
          Sair
        </button>

      </div>

    </header>
  );
}

// EXPORTA O COMPONENTE
export default Navbar;