import FinanceIcon from "./FinanceIcon";

export default function EntryPageHeader({ tipo, movimentacoes, carregando, erro }) {
  const income = tipo === "Receita";
  const items = movimentacoes.filter((item) => item.tipo === tipo);
  const total = items.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const currency = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function focusForm() {
    document.getElementById("entry-descricao")?.focus();
  }

  return <>
    <header className="entry-page-header">
      <div><div className="entry-heading"><span className="entry-heading-icon"><FinanceIcon name={income ? "up" : "down"} /></span><h1>{income ? "Receitas" : "Despesas"}</h1></div><p>{income ? "Gerencie suas entradas financeiras e acompanhe seus recebimentos." : "Gerencie suas saídas financeiras e mantenha seus gastos sob controle."}</p></div>
      <button className="entry-primary" type="button" onClick={focusForm}><FinanceIcon name="plus" />Nova {tipo}</button>
    </header>
    <section className="entry-overview" aria-label="Resumo financeiro">
      <article className="entry-total"><span className="entry-total-icon"><FinanceIcon name={income ? "up" : "down"} /></span><div><h2>Total de {income ? "receitas" : "despesas"}</h2><strong>{carregando || erro ? "—" : currency}</strong><p>{carregando ? "Carregando dados..." : erro ? "Dados indisponíveis" : "Todo o histórico cadastrado"}</p></div></article>
      <article className="entry-count"><span className="entry-count-icon"><FinanceIcon name="list" /></span><div><h2>Registros cadastrados</h2><strong>{carregando || erro ? "—" : items.length}</strong><p>{income ? "Entradas registradas no sistema" : "Saídas registradas no sistema"}</p></div></article>
    </section>
  </>;
}
