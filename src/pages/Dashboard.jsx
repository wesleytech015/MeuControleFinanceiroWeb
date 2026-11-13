import FinanceIcon from "../components/FinanceIcon";
import FinancialChart from "../components/FinancialChart";
import { useContext } from "react";
import Layout from "../components/Layout";
import { isCardsFeatureEnabled } from "../config/featureFlags.js";
import "../styles/dashboard.css";
import { FinanceContext } from "../context/financeContext.js";

function Dashboard() {
  const { movimentacoes, carregando, erro } = useContext(FinanceContext);
  const cardsEnabled = isCardsFeatureEnabled();
  const cartoes = cardsEnabled
    ? JSON.parse(localStorage.getItem("cartoes")) || []
    : [];

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

  const ultimasMovimentacoes = movimentacoes.slice(0, 5);

  return (
    <Layout>
      <div className="dashboard-page" aria-busy={carregando}>
      <div className="dashboard-header">
        <div>
          <h1><span className="dashboard-heading-icon"><FinanceIcon name="home" /></span>Dashboard</h1>
          <p>Resumo geral das suas finanças.</p>
          {erro && (
            <p className="mensagem-erro">
              Não foi possível sincronizar os dados: {erro}
            </p>
          )}
        </div>
      </div>

      <section className="cards-grid">
        <div className="finance-card receita">
          <div className="card-icon"><FinanceIcon name="up" /></div>
          <span>Receitas</span>
          <h2>{carregando || erro ? "—" : moeda(totalReceitas)}</h2>
          <p>Total cadastrado</p>
        </div>

        <div className="finance-card despesa">
          <div className="card-icon"><FinanceIcon name="down" /></div>
          <span>Despesas</span>
          <h2>{carregando || erro ? "—" : moeda(totalDespesas)}</h2>
          <p>Total cadastrado</p>
        </div>

        <div className="finance-card saldo">
          <div className="card-icon"><FinanceIcon name="coins" /></div>
          <span>Saldo Atual</span>
          <h2 className={saldo < 0 ? "negative-value" : ""}>{carregando || erro ? "—" : moeda(saldo)}</h2>
          <p>{carregando ? "Carregando..." : erro ? "Dados indisponíveis" : saldo >= 0 ? "Saldo positivo" : "Saldo negativo"}</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-title">
            <h3><FinanceIcon name="chart" />Evolução Financeira</h3>
            <span>Visão geral</span>
          </div>

          <FinancialChart movimentacoes={movimentacoes} carregando={carregando} erro={erro} moeda={moeda} />
        </div>

        <div className="dashboard-side">
          <section className="dashboard-card">
            <div className="card-title"><h3><FinanceIcon name="calendar" />Resumo do Período</h3></div>
            <p className="dashboard-period-note">Todo o histórico cadastrado</p>
            {[["Receitas", totalReceitas, "up", "income"], ["Despesas", totalDespesas, "down", "expense"], ["Saldo", saldo, "coins", saldo < 0 ? "expense" : "balance"]].map(([label, value, icon, color]) => <div className="dashboard-summary-row" key={label}><span className={`summary-icon ${color}`}><FinanceIcon name={icon} /></span><span>{label}</span><strong className={label === "Saldo" && saldo < 0 ? "negative-value" : ""}>{carregando || erro ? "—" : moeda(value)}</strong></div>)}
          </section>
          <section className={`dashboard-card dashboard-status ${!carregando && !erro && saldo < 0 ? "status-warning" : ""}`} role="status">
            <div className="card-title"><h3><FinanceIcon name="pie" />Status Financeiro</h3></div>
            <strong>{carregando ? "Carregando dados..." : erro ? "Dados indisponíveis" : !movimentacoes.length ? "Seu controle começa aqui." : saldo < 0 ? "Você está no negativo." : saldo > 0 ? "Seu saldo está positivo." : "Suas finanças estão equilibradas."}</strong>
            <p>{erro ? "Não foi possível sincronizar suas movimentações." : carregando ? "Sincronizando suas movimentações." : !movimentacoes.length ? "Cadastre sua primeira receita ou despesa." : saldo < 0 ? "Revise suas despesas e planeje seus próximos gastos." : "Acompanhe suas movimentações e mantenha seu planejamento."}</p>
          </section>
        {cardsEnabled && (
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
        )}
        </div>
      </section>

      <section className="dashboard-card">
        <div className="card-title">
          <h3>Últimas Movimentações</h3>
          <span>Registros recentes</span>
        </div>

        <div className="dashboard-table-scroll"><table className="dashboard-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Data</th>
            </tr>
          </thead>

          <tbody>
            {carregando ? (
              <tr>
                <td colSpan="4">Carregando movimentações...</td>
              </tr>
            ) : erro ? (
              <tr>
                <td colSpan="4" className="mensagem-erro">
                  Não foi possível carregar os dados: {erro}
                </td>
              </tr>
            ) : ultimasMovimentacoes.length === 0 ? (
              <tr>
                <td colSpan="4">Nenhuma movimentação cadastrada.</td>
              </tr>
            ) : (
              ultimasMovimentacoes.map((item) => (
                <tr key={item.id}>
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
        </table></div>
      </section>
    </div>
    </Layout>
  );
}

export default Dashboard;
