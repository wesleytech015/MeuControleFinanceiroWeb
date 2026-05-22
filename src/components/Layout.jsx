// IMPORTA O COMPONENTE DA SIDEBAR
// (MENU LATERAL DO SISTEMA)
import Sidebar from "./Sidebar";

// IMPORTA O COMPONENTE DA NAVBAR
// (BARRA SUPERIOR DO SISTEMA)
import Navbar from "./Navbar";

// IMPORTA O CSS DO LAYOUT
import "../styles/layout.css";

// COMPONENTE PRINCIPAL DE ESTRUTURA
// RECEBE O "children" PARA RENDERIZAR
// O CONTEÚDO DAS PÁGINAS
function Layout({ children }) {

  return (

    // CONTAINER PRINCIPAL DO LAYOUT
    <div className="layout">

      {/* MENU LATERAL */}
      <Sidebar />

      {/* ÁREA PRINCIPAL */}
      <main className="layout-main">

        {/* BARRA SUPERIOR */}
        <Navbar />

        {/* CONTEÚDO DAS PÁGINAS */}
        <section className="layout-content">

          {/* RENDERIZA O CONTEÚDO DINÂMICO */}
          {children}

        </section>

      </main>

    </div>
  );
}

// EXPORTA O COMPONENTE
export default Layout;