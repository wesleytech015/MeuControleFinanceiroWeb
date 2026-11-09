import Layout from "../components/Layout";
import { useFinanceiro } from "../context/FinanceContext";
import "../styles/relatorios.css";

function Relatorios() {
  const { movimentacoes } = useFinanceiro();

  const cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];

  function formatarReal(valor) {
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

  const totalFaturaCartoes = cartoes.reduce(
    (total, cartao) => total + Number(cartao.fatura || 0),
    0
  );

  const totalLimiteCartoes = cartoes.reduce(
    (total, cartao) => total + Number(cartao.limite || 0),
    0
  );

  const maiorValor = Math.max(totalReceitas, totalDespesas, Math.abs(saldo), 1);

  function alturaBarra(valor) {
    return `${Math.max((Math.abs(valor) / maiorValor) * 180, 20)}px`;
  }

  const despesasPorCategoria = movimentacoes
    .filter((item) => item.tipo === "Despesa")
    .reduce((acc, item) => {
      const categoria = item.categoria || "Sem categoria";
      acc[categoria] = (acc[categoria] || 0) + Number(item.valor || 0);
      return acc;
    }, {});

  const rankingCategorias = Object.entries(despesasPorCategoria)
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  const ultimasMovimentacoes = [...movimentacoes].slice(-5).reverse();

  return (
    <Layout>
      <div className="page-container">
        <div className="relatorios-header">
          <div>
            <h1>Relatórios</h1>
            <p>Análise visual e detalhada das suas finanças.</p>
          </div>
        </div>

        <section className="relatorios-cards">
          <div className="relatorio-card receita-card">
            <span>Receitas</span>
            <h2>{formatarReal(totalReceitas)}</h2>
            <p>Total recebido</p>
          </div>

          <div className="relatorio-card despesa-card">
            <span>Despesas</span>
            <h2>{formatarReal(totalDespesas)}</h2>
            <p>Total gasto</p>
          </div>

          <div className="relatorio-card saldo-card">
            <span>Saldo</span>
            <h2>{formatarReal(saldo)}</h2>
            <p>{saldo >= 0 ? "Resultado positivo" : "Resultado negativo"}</p>
          </div>

          <div className="relatorio-card cartao-card">
            <span>Fatura Cartões</span>
            <h2>{formatarReal(totalFaturaCartoes)}</h2>
            <p>Limite total: {formatarReal(totalLimiteCartoes)}</p>
          </div>
        </section>

        <section className="relatorios-grid">
          <div className="grafico-card">
            <div className="card-title">
              <h3>Comparativo Financeiro</h3>
              <span>Receitas x Despesas x Saldo</span>
            </div>

            <div className="grafico-barras">
              <div className="barra-item">
                <div
                  className="barra receita"
                  style={{ height: alturaBarra(totalReceitas) }}
                ></div>
                <strong>{formatarReal(totalReceitas)}</strong>
                <span>Receitas</span>
              </div>

              <div className="barra-item">
                <div
                  className="barra despesa"
                  style={{ height: alturaBarra(totalDespesas) }}
                ></div>
                <strong>{formatarReal(totalDespesas)}</strong>
                <span>Despesas</span>
              </div>

              <div className="barra-item">
                <div
                  className="barra saldo"
                  style={{ height: alturaBarra(saldo) }}
                ></div>
                <strong>{formatarReal(saldo)}</strong>
                <span>Saldo</span>
              </div>
            </div>
          </div>

          <div className="resumo-card">
            <div className="card-title">
              <h3>Resumo Financeiro</h3>
              <span>Geral</span>
            </div>

            <div className="resumo-item">
              <span>Receitas</span>
              <strong className="texto-receita">{formatarReal(totalReceitas)}</strong>
            </div>

            <div className="resumo-item">
              <span>Despesas</span>
              <strong className="texto-despesa">{formatarReal(totalDespesas)}</strong>
            </div>

            <div className="resumo-item">
              <span>Saldo</span>
              <strong className={saldo >= 0 ? "texto-receita" : "texto-despesa"}>
                {formatarReal(saldo)}
              </strong>
            </div>

            <div className="resumo-item">
              <span>Movimentações</span>
              <strong>{movimentacoes.length}</strong>
            </div>
          </div>
        </section>

        <section className="relatorios-grid inferior">
          <div className="grafico-card">
            <div className="card-title">
              <h3>Despesas por Categoria</h3>
              <span>Top 5</span>
            </div>

            <div className="ranking-lista">
              {rankingCategorias.length === 0 ? (
                <p className="empty-message">Nenhuma despesa cadastrada.</p>
              ) : (
                rankingCategorias.map((item) => (
                  <div className="ranking-item" key={item.categoria}>
                    <div>
                      <strong>{item.categoria}</strong>
                      <span>{formatarReal(item.valor)}</span>
                    </div>

                    <div className="ranking-barra">
                      <div
                        style={{
                          width: `${Math.min(
                            (item.valor / totalDespesas) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="resumo-card">
            <div className="card-title">
              <h3>Últimas Movimentações</h3>
              <span>Recentes</span>
            </div>

            <div className="movimentacoes-lista">
              {ultimasMovimentacoes.length === 0 ? (
                <p className="empty-message">Nenhuma movimentação cadastrada.</p>
              ) : (
                ultimasMovimentacoes.map((item, index) => (
                  <div className="movimentacao-item" key={index}>
                    <div>
                      <strong>{item.descricao}</strong>
                      <span>{item.data}</span>
                    </div>

                    <strong
                      className={
                        item.tipo === "Receita" ? "texto-receita" : "texto-despesa"
                      }
                    >
                      {formatarReal(item.valor)}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Relatorios;