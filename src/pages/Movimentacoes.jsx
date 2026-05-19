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

  // ESTADO DO FILTRO POR DATA
  const [dataFiltro, setDataFiltro] = useState("");

  // CONVERTE DATA BRASILEIRA PARA FORMATO HTML
  // Exemplo: 13/05/2026 -> 2026-05-13
  function converterDataParaInput(dataBR) {
    const partes = dataBR.split("/");

    if (partes.length !== 3) {
      return "";
    }

    const dia = partes[0];
    const mes = partes[1];
    const ano = partes[2];

    return `${ano}-${mes}-${dia}`;
  }

  // FILTRA AS MOVIMENTAÇÕES POR BUSCA, TIPO E DATA
  const movimentacoesFiltradas = movimentacoes.filter((item) => {
    // FILTRO POR DESCRIÇÃO
    const correspondeBusca = item.descricao
      .toLowerCase()
      .includes(busca.toLowerCase());

    // FILTRO POR TIPO
    const correspondeTipo =
      tipoFiltro === "Todos" || item.tipo === tipoFiltro;

    // FILTRO POR DATA
    const correspondeData =
      dataFiltro === "" ||
      converterDataParaInput(item.data) === dataFiltro;

    // RETORNA APENAS OS ITENS QUE PASSAM NOS 3 FILTROS
    return correspondeBusca && correspondeTipo && correspondeData;
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

        {/* FILTRO POR DATA */}
        <input
          type="date"
          value={dataFiltro}
          onChange={(e) => setDataFiltro(e.target.value)}
        />
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

export default Movimentacoes;