import Layout from "../components/Layout";
import "../styles/dashboard.css";

function Relatorios() {
  return (
    <Layout>
      <div className="dashboard-header">
        <h1>Relatórios</h1>
        <p>Análise visual das suas finanças.</p>
      </div>

      <section className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Comparativo Mensal</h3>

          <div className="fake-chart">
            <div className="bar receita-bar"></div>
            <div className="bar despesa-bar"></div>
            <div className="bar saldo-bar"></div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Resumo</h3>
          <p>Receitas: R$ 34.000</p>
          <p>Despesas: R$ 8.000</p>
          <p>Saldo: R$ 26.000</p>
        </div>
      </section>
    </Layout>
  );
}

export default Relatorios;