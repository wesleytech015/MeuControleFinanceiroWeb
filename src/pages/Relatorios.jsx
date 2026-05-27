// IMPORTA O LAYOUT PADRÃO
import Layout from "../components/Layout";

// IMPORTA O CONTEXTO FINANCEIRO
import { useFinanceiro } from "../context/FinanceContext";

// IMPORTA O CSS
import "../styles/relatorios.css";

function Relatorios() {
  // BUSCA AS MOVIMENTAÇÕES CADASTRADAS
  const { movimentacoes } = useFinanceiro();

  // SOMA TODAS AS RECEITAS
  const totalReceitas = movimentacoes
    .filter((item) => item.tipo === "Receita")
    .reduce((total, item) => total + Number(item.valor), 0);

  // SOMA TODAS AS DESPESAS
  const totalDespesas = movimentacoes
    .filter((item) => item.tipo === "Despesa")
    .reduce((total, item) => total + Number(item.valor), 0);

  // CALCULA O SALDO
  const saldo = totalReceitas - totalDespesas;

  // FORMATA VALORES EM REAL
  function formatarReal(valor) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <Layout>
      <div className="page-container">
        <h1>Relatórios</h1>

        <p className="page-subtitle">
          Análise visual das suas finanças.
        </p>

        <div className="relatorios-grid">
          <div className="grafico-card">
            <h3>Comparativo Mensal</h3>

            <div className="grafico-barras">
              <div
                className="barra receita"
                style={{
                  height: `${Math.min(totalReceitas / 100, 180)}px`,
                }}
              ></div>

              <div
                className="barra despesa"
                style={{
                  height: `${Math.min(totalDespesas / 100, 180)}px`,
                }}
              ></div>

              <div
                className="barra saldo"
                style={{
                  height: `${Math.min(Math.abs(saldo) / 100, 180)}px`,
                }}
              ></div>
            </div>
          </div>

          <div className="resumo-card">
            <h3>Resumo</h3>

            <p>Receitas: {formatarReal(totalReceitas)}</p>

            <p>Despesas: {formatarReal(totalDespesas)}</p>

            <p>Saldo: {formatarReal(saldo)}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Relatorios;