import Layout from "../components/Layout";
import "../styles/metas.css";

function Metas() {
  return (
    <Layout>
      <div className="page-header">
        <h1>Metas</h1>
        <p>Acompanhe seus objetivos financeiros.</p>
      </div>

      <section className="metas-grid">
        <div className="meta-card">
          <div className="meta-header">
            <h2>Notebook</h2>
            <span>70%</span>
          </div>

          <p>R$ 3.500 de R$ 5.000</p>

          <div className="meta-progress">
            <div className="meta-fill notebook"></div>
          </div>

          <button>Adicionar valor</button>
        </div>

        <div className="meta-card">
          <div className="meta-header">
            <h2>Viagem</h2>
            <span>45%</span>
          </div>

          <p>R$ 2.250 de R$ 5.000</p>

          <div className="meta-progress">
            <div className="meta-fill viagem"></div>
          </div>

          <button>Adicionar valor</button>
        </div>

        <div className="meta-card">
          <div className="meta-header">
            <h2>Reserva</h2>
            <span>30%</span>
          </div>

          <p>R$ 1.500 de R$ 5.000</p>

          <div className="meta-progress">
            <div className="meta-fill reserva"></div>
          </div>

          <button>Adicionar valor</button>
        </div>
      </section>
    </Layout>
  );
}

export default Metas;