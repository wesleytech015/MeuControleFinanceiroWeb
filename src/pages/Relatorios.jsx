// IMPORTA O LAYOUT PADRÃO
import Layout from "../components/Layout";

// IMPORTA O CONTEXTO FINANCEIRO
import { useFinanceiro } from "../context/FinanceContext";

// IMPORTA O CSS
import "../styles/relatorios.css";

// COMPONENTE DA TELA DE RELATÓRIOS
function Relatorios() {

  // BUSCA AS MOVIMENTAÇÕES
  const { movimentacoes } = useFinanceiro();

  // SOMA TODAS AS RECEITAS
  const totalReceitas = movimentacoes
    .filter((item) => item.tipo === "Receita")
    .reduce(
      (total, item) =>
        total + Number(item.valor),
      0
    );

  // SOMA TODAS AS DESPESAS
  const totalDespesas = movimentacoes
    .filter((item) => item.tipo === "Despesa")
    .reduce(
      (total, item) =>
        total + Number(item.valor),
      0
    );

  // CALCULA O SALDO
  const saldo =
    totalReceitas - totalDespesas;

  // FORMATA VALOR EM REAL
  function formatarReal(valor) {

    return valor.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  return (

    // LAYOUT PRINCIPAL
    <Layout>

      {/* CONTAINER */}
      <div className="page-container">

        {/* TÍTULO */}
        <h1>Relatórios</h1>

        {/* SUBTÍTULO */}
        <p className="page-subtitle">
          Análise visual das suas finanças.
        </p>

        {/* GRID */}
        <div className="relatorios-grid">

          {/* CARD DO GRÁFICO */}
          <div className="grafico-card">

            <h3>Comparativo Mensal</h3>

            {/* BARRAS */}
            <div className="grafico-barras">

              {/* RECEITAS */}
              <div
                className="barra receita"
                style={{
                  height: `${
                    Math.min(
                      totalReceitas / 100,
                      180
                    )
                  }px`,
                }}
              ></div>

              {/* DESPESAS */}
              <div
                className="barra despesa"
                style={{
                  height: `${
                    Math.min(
                      totalDespesas / 100,
                      180
                    )
                  }px`,
                }}
              ></div>

              {/* SALDO */}
              <div
                className="barra saldo"
                style={{
                  height: `${
                    Math.min(
                      Math.abs(saldo) / 100,
                      180
                    )
                  }px`,
                }}
              ></div>

            </div>

          </div>

          {/* CARD RESUMO */}
          <div className="resumo-card">

            <h3>Resumo Financeiro</h3>

            <p>
              Receitas:
              {" "}
              {formatarReal(totalReceitas)}
            </p>

            <p>
              Despesas:
              {" "}
              {formatarReal(totalDespesas)}
            </p>

            <p>
              Saldo:
              {" "}
              {formatarReal(saldo)}
            </p>

          </div>

        </div>

      </div>

    </Layout>
  );
}

// EXPORTA COMPONENTE
export default Relatorios;