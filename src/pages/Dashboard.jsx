import Layout from "../components/Layout";
import "../styles/dashboard.css";
import { useFinanceiro } from "../context/FinanceContext";

function Dashboard() {
  const { movimentacoes } = useFinanceiro();

  const cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];

  function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const totalReceitas = movimentacoes
    .filter((item) => item.tipo === "Receita")
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const totalDespesas = movimentacoes
    .filter((item) => item.tipo === "Despesa")
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const saldo = totalReceitas - totalDespesas;

  const totalLimiteCartoes = cartoes.reduce(
    (total, cartao) => total + Number(cartao.limite || 0),
    0
  );

  const totalFaturaCartoes = cartoes.reduce(
    (total, cartao) => total + Number(cartao.fatura || 0),
    0
  );

  const limiteDisponivel = totalLimiteCartoes - totalFaturaCartoes;

  const ultimasMovimentacoes = [...movimentacoes].slice(-5).reverse();

  return (
    <Layout>
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumo geral das suas finanças.</p>
        </div>
      </div>

      <section className="cards-grid">
        <div className="finance-card receita">
          <div className="card-icon">↗</div>
          <span>Receitas</span>
          <h2>{moeda(totalReceitas)}</h2>
          <p>Total cadastrado</p>
        </div>

        <div className="finance-card despesa">
          <div className="card-icon">↘</div>
          <span>Despesas</span>
          <h2>{moeda(totalDespesas)}</h2>
          <p>Total cadastrado</p>
        </div>

        <div className="finance-card saldo">
          <div className="card-icon">💰</div>
          <span>Saldo Atual</span>
          <h2>{moeda(saldo)}</h2>
          <p>{saldo >= 0 ? "Saldo positivo" : "Saldo negativo"}</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-title">
            <h3>Evolução Financeira</h3>
            <span>Visão geral</span>
          </div>

          <div className="fake-chart">
            <div className="chart-line"></div>
            <div className="chart-dot dot-1"></div>
            <div className="chart-dot dot-2"></div>
            <div className="chart-dot dot-3"></div>
            <div className="chart-dot dot-4"></div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-title">
            <h3>Cartões</h3>
            <span>Resumo</span>
          </div>

          <div className="cartao-resumo-item">
            <span>Limite Total</span>
            <strong>{moeda(totalLimiteCartoes)}</strong>
          </div>

          <div className="cartao-resumo-item">
            <span>Fatura Atual</span>
            <strong>{moeda(totalFaturaCartoes)}</strong>
          </div>

          <div className="cartao-resumo-item">
            <span>Disponível</span>
            <strong>{moeda(limiteDisponivel)}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="card-title">
          <h3>Últimas Movimentações</h3>
          <span>Registros recentes</span>
        </div>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Data</th>
            </tr>
          </thead>

          <tbody>
            {ultimasMovimentacoes.length === 0 ? (
              <tr>
                <td colSpan="4">Nenhuma movimentação cadastrada.</td>
              </tr>
            ) : (
              ultimasMovimentacoes.map((item, index) => (
                <tr key={index}>
                  <td>{item.descricao}</td>
                  <td>
                    <span
                      className={
                        item.tipo === "Receita"
                          ? "receita-text"
                          : "despesa-text"
                      }
                    >
                      {item.tipo}
                    </span>
                  </td>
                  <td>{moeda(item.valor)}</td>
                  <td>{item.data}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </Layout>
  );
}

export default Dashboard;