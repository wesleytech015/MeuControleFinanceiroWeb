import { useState } from "react";

import Layout from "../components/Layout";
import "../styles/tabela.css";
import { useFinanceiro } from "../context/FinanceContext";

function Movimentacoes() {
  const {
    movimentacoes,
    excluirMovimentacao,
    atualizarMovimentacao,
    carregando = false,
  } = useFinanceiro();

  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [editandoIndex, setEditandoIndex] = useState(null);
  const [descricaoEditada, setDescricaoEditada] = useState("");
  const [valorEditado, setValorEditado] = useState("");
  const [dataEditada, setDataEditada] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  function converterDataParaInput(data) {
    if (!data) return "";

    if (data.includes("-")) {
      return data.substring(0, 10);
    }

    const partes = data.split("/");
    if (partes.length !== 3) return "";

    const [dia, mes, ano] = partes;
    return `${ano}-${mes}-${dia}`;
  }

  function converterDataParaBR(data) {
    if (!data) return "";

    if (data.includes("/")) return data;

    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function iniciarEdicao(item, indiceOriginal) {
    setEditandoIndex(indiceOriginal);
    setDescricaoEditada(item.descricao);
    setValorEditado(item.valor);
    setDataEditada(converterDataParaInput(item.data));
    setMensagem("");
    setErro("");
  }

  function salvarEdicao(indiceOriginal) {
    if (!descricaoEditada || !valorEditado || !dataEditada) {
      setErro("Preencha todos os campos antes de salvar.");
      setMensagem("");
      return;
    }

    atualizarMovimentacao(indiceOriginal, {
      descricao: descricaoEditada,
      valor: Number(valorEditado),
      data: converterDataParaBR(dataEditada),
    });

    setEditandoIndex(null);
    setDescricaoEditada("");
    setValorEditado("");
    setDataEditada("");

    setMensagem("Movimentação atualizada com sucesso!");
    setErro("");
  }

  function cancelarEdicao() {
    setEditandoIndex(null);
    setDescricaoEditada("");
    setValorEditado("");
    setDataEditada("");
    setMensagem("");
    setErro("");
  }

  function excluirItem(indiceOriginal) {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta movimentação?"
    );

    if (!confirmar) return;

    excluirMovimentacao(indiceOriginal);

    setMensagem("Movimentação excluída com sucesso.");
    setErro("");
  }

  const movimentacoesFiltradas = movimentacoes
    .map((item, index) => ({
      ...item,
      indiceOriginal: index,
    }))
    .filter((item) => {
      const correspondeBusca = item.descricao
        ?.toLowerCase()
        .includes(busca.toLowerCase());

      const correspondeTipo =
        tipoFiltro === "Todos" || item.tipo === tipoFiltro;

      const dataMovimentacao = converterDataParaInput(item.data);

      const correspondeDataInicio =
        dataInicio === "" || dataMovimentacao >= dataInicio;

      const correspondeDataFim =
        dataFim === "" || dataMovimentacao <= dataFim;

      return (
        correspondeBusca &&
        correspondeTipo &&
        correspondeDataInicio &&
        correspondeDataFim
      );
    });

  return (
    <Layout>
      <div className="page-header">
        <h1>Movimentações</h1>
        <p>Veja todas as receitas e despesas cadastradas.</p>
      </div>

      {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}
      {erro && <p className="mensagem-erro">{erro}</p>}

      <div className="filtros-card">
        <input
          type="text"
          placeholder="Buscar por descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
        >
          <option value="Todos">Todos</option>
          <option value="Receita">Receitas</option>
          <option value="Despesa">Despesas</option>
        </select>

        <div className="filtros-data">
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {carregando && (
              <tr>
                <td colSpan="5">Carregando movimentações...</td>
              </tr>
            )}

            {!carregando &&
              movimentacoesFiltradas.map((item) => (
                <tr key={item.indiceOriginal}>
                  <td>
                    <span
                      className={
                        item.tipo === "Receita"
                          ? "tag receita"
                          : "tag despesa"
                      }
                    >
                      {item.tipo}
                    </span>
                  </td>

                  <td>
                    {editandoIndex === item.indiceOriginal ? (
                      <input
                        type="text"
                        value={descricaoEditada}
                        onChange={(e) =>
                          setDescricaoEditada(e.target.value)
                        }
                      />
                    ) : (
                      item.descricao
                    )}
                  </td>

                  <td>
                    {editandoIndex === item.indiceOriginal ? (
                      <input
                        type="number"
                        value={valorEditado}
                        onChange={(e) =>
                          setValorEditado(e.target.value)
                        }
                      />
                    ) : (
                      Number(item.valor).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    )}
                  </td>

                  <td>
                    {editandoIndex === item.indiceOriginal ? (
                      <input
                        type="date"
                        value={dataEditada}
                        onChange={(e) => setDataEditada(e.target.value)}
                      />
                    ) : (
                      item.data
                    )}
                  </td>

                  <td>
                    {editandoIndex === item.indiceOriginal ? (
                      <>
                        <button
                          className="btn-edit"
                          onClick={() => salvarEdicao(item.indiceOriginal)}
                        >
                          Salvar
                        </button>

                        <button
                          className="btn-delete"
                          onClick={cancelarEdicao}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-edit"
                          onClick={() =>
                            iniciarEdicao(item, item.indiceOriginal)
                          }
                        >
                          Atualizar
                        </button>

                        <button
                          className="btn-delete"
                          onClick={() => excluirItem(item.indiceOriginal)}
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

            {!carregando && movimentacoesFiltradas.length === 0 && (
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