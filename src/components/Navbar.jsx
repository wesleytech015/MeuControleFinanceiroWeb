// COMPONENTE DA NAVBAR (BARRA SUPERIOR)

function Navbar() {

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

        {/* NOME DO USUÁRIO */}
        <div className="navbar-user">

          <span className="user-badge">
            Olá, Eliézer
          </span>

        </div>

        {/* BOTÃO SAIR SEPARADO */}
        <button className="btn-sair" onClick={sair}>

          Sair

        </button>

      </div>

    </header>
  );
}

// EXPORTA O COMPONENTE
export default Navbar;