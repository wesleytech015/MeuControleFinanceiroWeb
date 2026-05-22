// IMPORTA O COMPONENTE DE LAYOUT
// (ESTRUTURA PADRÃO COM MENU LATERAL E NAVBAR)
import Layout from "../components/Layout";

// IMPORTA O CSS DA DASHBOARD
import "../styles/dashboard.css";

// IMPORTA O CONTEXTO GLOBAL DAS FINANÇAS
// PARA ACESSAR AS MOVIMENTAÇÕES
import { useFinanceiro } from "../context/FinanceContext";

function Dashboard() {

  // RECUPERA TODAS AS MOVIMENTAÇÕES
  // DO CONTEXTO GLOBAL
  const { movimentacoes } = useFinanceiro();

  // FILTRA APENAS AS RECEITAS
  // E SOMA TODOS OS VALORES
  const totalReceitas = movimentacoes
    .filter((item) => item.tipo === "Receita")
    .reduce((total, item) => total + item.valor, 0);

  // FILTRA APENAS AS DESPESAS
  // E SOMA TODOS OS VALORES
  const totalDespesas = movimentacoes
    .filter((item) => item.tipo === "Despesa")
    .reduce((total, item) => total + item.valor, 0);

  // CALCULA O SALDO FINAL
  const saldo = totalReceitas - totalDespesas;

  return (

    // COMPONENTE PADRÃO DE LAYOUT
    <Layout>

      {/* CABEÇALHO DA DASHBOARD */}
      <div className="dashboard-header">

        {/* TÍTULO PRINCIPAL */}
        <div>

          <h1>Dashboard</h1>

          <p>
            Resumo geral das suas finanças.
          </p>

        </div>

      </div>

      {/* GRID DOS CARDS FINANCEIROS */}
      <section className="cards-grid">

        {/* CARD DE RECEITAS */}
        <div className="finance-card receita">

          <h3>Receitas</h3>

          <h2>
            {totalReceitas.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </h2>

          <span>
            Total cadastrado
          </span>

        </div>

        {/* CARD DE DESPESAS */}
        <div className="finance-card despesa">

          <h3>Despesas</h3>

          <h2>
            {totalDespesas.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </h2>

          <span>
            Total cadastrado
          </span>

        </div>

        {/* CARD DE SALDO */}
        <div className="finance-card saldo">

          <h3>Saldo Atual</h3>

          <h2>
            {saldo.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </h2>

          <span>
            {saldo >= 0
              ? "Saldo positivo"
              : "Saldo negativo"}
          </span>

        </div>

      </section>

    </Layout>
  );
}

// EXPORTA O COMPONENTE
export default Dashboard;