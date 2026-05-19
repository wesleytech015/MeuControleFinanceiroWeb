import Layout from "../components/Layout";
import "../styles/dashboard.css";
import { useFinanceiro } from "../context/FinanceContext";

function Dashboard() {
  const { movimentacoes } = useFinanceiro();

  const totalReceitas = movimentacoes
    .filter((item) => item.tipo === "Receita")
    .reduce((total, item) => total + item.valor, 0);

  const totalDespesas = movimentacoes
    .filter((item) => item.tipo === "Despesa")
    .reduce((total, item) => total + item.valor, 0);

  const saldo = totalReceitas - totalDespesas;

  return (
    <Layout>
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Resumo geral das suas finanças.</p>
      </div>

      <section className="cards-grid">
        <div className="finance-card receita">
          <h3>Receitas</h3>

          <h2>
            {totalReceitas.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </h2>

          <span>Total cadastrado</span>
        </div>

        <div className="finance-card despesa">
          <h3>Despesas</h3>

          <h2>
            {totalDespesas.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </h2>

          <span>Total cadastrado</span>
        </div>

        <div className="finance-card saldo">
          <h3>Saldo Atual</h3>

          <h2>
            {saldo.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </h2>

          <span>
            {saldo >= 0 ? "Saldo positivo" : "Saldo negativo"}
          </span>
        </div>
      </section>
    </Layout>
  );
}

export default Dashboard;