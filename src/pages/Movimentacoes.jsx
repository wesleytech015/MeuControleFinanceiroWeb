import { useState } from "react";

// IMPORTA O LAYOUT PADRÃO DO SISTEMA
import Layout from "../components/Layout";

// IMPORTA O CSS DA TABELA
import "../styles/tabela.css";

// IMPORTA O CONTEXTO GLOBAL FINANCEIRO
import { useFinanceiro } from "../context/FinanceContext";

function Movimentacoes() {
  // PEGA AS MOVIMENTAÇÕES E A FUNÇÃO DE EXCLUIR
  const { movimentacoes, excluirMovimentacao } = useFinanceiro();

  // ESTADO DO CAMPO DE BUSCA
  const [busca, setBusca] = useState("");

  // ESTADO DO FILTRO POR TIPO
  const [tipoFiltro, setTipoFiltro] = useState("Todos");

  // ESTADO DO FILTRO DE DATA INICIAL
  const [dataInicio, setDataInicio] = useState("");

  // ESTADO DO FILTRO DE DATA FINAL
  const [dataFim, setDataFim] = useState("");

  // CONVERTE DATA BRASILEIRA PARA FORMATO HTML
  // EXEMPLO: 13/05/2026 -> 2026-05-13
  function converterDataParaInput(dataBR) {
    // VERIFICA SE A DATA EXISTE
    if (!dataBR) {
      return "";
    }

    // SEPARA DIA, MÊS E ANO
    const partes = dataBR.split("/");

    // VERIFICA SE A DATA TEM 3 PARTES
    if (partes.length !== 3) {
      return "";
    }

    // PEGA O DIA
    const dia = partes[0];

    // PEGA O MÊS
    const mes = partes[1];

    // PEGA O ANO
    const ano = partes[2];

    // RETORNA A DATA NO FORMATO YYYY-MM-DD
    return `${ano}-${mes}-${dia}`;
  }

  // FILTRA AS MOVIMENTAÇÕES POR BUSCA, TIPO, DATA INICIAL E DATA FINAL
  const movimentacoesFiltradas = movimentacoes.filter((item) => {
    // FILTRO POR DESCRIÇÃO
    const correspondeBusca = item.descricao
      .toLowerCase()
      .includes(busca.toLowerCase());

    // FILTRO POR TIPO
    const correspondeTipo =
      tipoFiltro === "Todos" || item.tipo === tipoFiltro;

    // CONVERTE A DATA DA MOVIMENTAÇÃO PARA O FORMATO HTML
    const dataMovimentacao = converterDataParaInput(item.data);

    // FILTRO POR DATA INICIAL
    const correspondeDataInicio =
      dataInicio === "" || dataMovimentacao >= dataInicio;

    // FILTRO POR DATA FINAL
    const correspondeDataFim =
      dataFim === "" || dataMovimentacao <= dataFim;

    // RETORNA APENAS OS ITENS QUE PASSAM NOS FILTROS
    return (
      correspondeBusca &&
      correspondeTipo &&
      correspondeDataInicio &&
      correspondeDataFim
    );
  });

  return (
    <Layout>
      {/* CABEÇALHO DA PÁGINA */}
      <div className="page-header">
        <h1>Movimentações</h1>
        <p>Veja todas as receitas e despesas cadastradas.</p>
      </div>

      {/* ÁREA DOS FILTROS */}
      <div className="filtros-card">
        {/* CAMPO DE BUSCA */}
        <input
          type="text"
          placeholder="Buscar por descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        {/* FILTRO POR TIPO */}
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
        >
          <option value="Todos">Todos</option>
          <option value="Receita">Receitas</option>
          <option value="Despesa">Despesas</option>
        </select>

        {/* ÁREA DOS FILTROS DE DATA */}
        <div className="filtros-data">
          {/* FILTRO POR DATA INICIAL */}
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          {/* FILTRO POR DATA FINAL */}
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
      </div>

      {/* CARD DA TABELA */}
      <div className="table-card">
        <table>
          {/* CABEÇALHO DA TABELA */}
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>

          {/* CORPO DA TABELA */}
          <tbody>
            {movimentacoesFiltradas.map((item, index) => (
              <tr key={index}>
                {/* TIPO */}
                <td>
                  <span
                    className={
                      item.tipo === "Receita" ? "tag receita" : "tag despesa"
                    }
                  >
                    {item.tipo}
                  </span>
                </td>

                {/* DESCRIÇÃO */}
                <td>{item.descricao}</td>

                {/* VALOR FORMATADO */}
                <td>
                  {item.valor.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </td>

                {/* DATA */}
                <td>{item.data}</td>

                {/* AÇÕES */}
                <td>
                  <button
                    className="btn-delete"
                    onClick={() => excluirMovimentacao(index)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}

            {/* MENSAGEM CASO NÃO ENCONTRE RESULTADOS */}
            {movimentacoesFiltradas.length === 0 && (
              <tr>
                <td colSpan="5">Nenhuma movimentação encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

// EXPORTA O COMPONENTE
export default Movimentacoes;