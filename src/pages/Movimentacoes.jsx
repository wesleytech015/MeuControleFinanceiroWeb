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
  const [categoriaEditada, setCategoriaEditada] = useState("");
  const [formaPagamentoEditada, setFormaPagamentoEditada] = useState("");
  const [cartaoIdEditado, setCartaoIdEditado] = useState("");
  const [parcelasEditadas, setParcelasEditadas] = useState("1");

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const cartoes = JSON.parse(localStorage.getItem("cartoes")) || [];

  const categorias = [
    "Alimentação",
    "Transporte",
    "Moradia",
    "Saúde",
    "Educação",
    "Lazer",
    "Mercado",
    "Assinaturas",
    "Contas",
    "Cartão de Crédito",
    "Outros",
  ];

  function formatarMoeda(valorDigitado) {
    const somenteNumeros = valorDigitado.replace(/\D/g, "");

    return (Number(somenteNumeros) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function converterMoedaParaNumero(valorFormatado) {
    return Number(
      String(valorFormatado)
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim()
    );
  }

  function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function converterDataParaInput(data) {
    if (!data) return "";

    if (data.includes("-")) return data.substring(0, 10);

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

  function atualizarFaturaCartao(cartaoId, valorDiferenca) {
    if (!cartaoId) return;

    const cartoesSalvos = JSON.parse(localStorage.getItem("cartoes")) || [];

    const cartoesAtualizados = cartoesSalvos.map((cartao) => {
      if (cartao.id !== Number(cartaoId)) return cartao;

      const novaFatura = Number(cartao.fatura || 0) + Number(valorDiferenca);

      return {
        ...cartao,
        fatura: novaFatura < 0 ? 0 : novaFatura,
      };
    });

    localStorage.setItem("cartoes", JSON.stringify(cartoesAtualizados));
  }

  function iniciarEdicao(item, indiceOriginal) {
    setEditandoIndex(indiceOriginal);
    setDescricaoEditada(item.descricao);
    setValorEditado(moeda(item.valor));
    setDataEditada(converterDataParaInput(item.data));
    setCategoriaEditada(item.categoria || "");
    setFormaPagamentoEditada(item.forma_pagamento || "");
    setCartaoIdEditado(item.cartao_id ? String(item.cartao_id) : "");
    setParcelasEditadas(item.parcelas ? String(item.parcelas) : "1");
    setMensagem("");
    setErro("");
  }

  function salvarEdicao(indiceOriginal) {
    if (!descricaoEditada || !valorEditado || !dataEditada) {
      setErro("Preencha descrição, valor e data antes de salvar.");
      setMensagem("");
      return;
    }

    if (
      formaPagamentoEditada === "Cartão de Crédito" &&
      !cartaoIdEditado
    ) {
      setErro("Selecione o cartão de crédito.");
      setMensagem("");
      return;
    }

    const movimentacaoAntiga = movimentacoes[indiceOriginal];
    const valorNovo = converterMoedaParaNumero(valorEditado);
    const valorAntigo = Number(movimentacaoAntiga.valor || 0);

    if (movimentacaoAntiga.forma_pagamento === "Cartão de Crédito") {
      atualizarFaturaCartao(movimentacaoAntiga.cartao_id, -valorAntigo);
    }

    if (formaPagamentoEditada === "Cartão de Crédito") {
      atualizarFaturaCartao(Number(cartaoIdEditado), valorNovo);
    }

    atualizarMovimentacao(indiceOriginal, {
      descricao: descricaoEditada,
      valor: valorNovo,
      data: converterDataParaBR(dataEditada),
      categoria: categoriaEditada,
      forma_pagamento: formaPagamentoEditada,
      cartao_id:
        formaPagamentoEditada === "Cartão de Crédito"
          ? Number(cartaoIdEditado)
          : null,
      parcelas:
        formaPagamentoEditada === "Cartão de Crédito"
          ? Number(parcelasEditadas)
          : 1,
    });

    setEditandoIndex(null);
    setMensagem("Movimentação atualizada com sucesso!");
    setErro("");
  }

  function cancelarEdicao() {
    setEditandoIndex(null);
    setMensagem("");
    setErro("");
  }

  function excluirItem(indiceOriginal) {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta movimentação?"
    );

    if (!confirmar) return;

    const movimentacaoExcluida = movimentacoes[indiceOriginal];

    if (movimentacaoExcluida.forma_pagamento === "Cartão de Crédito") {
      atualizarFaturaCartao(
        movimentacaoExcluida.cartao_id,
        -Number(movimentacaoExcluida.valor || 0)
      );
    }

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
              <th>Categoria</th>
              <th>Pagamento</th>
              <th>Valor</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {carregando && (
              <tr>
                <td colSpan="7">Carregando movimentações...</td>
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
                      <select
                        value={categoriaEditada}
                        onChange={(e) =>
                          setCategoriaEditada(e.target.value)
                        }
                      >
                        <option value="">Categoria</option>
                        {categorias.map((categoria) => (
                          <option key={categoria} value={categoria}>
                            {categoria}
                          </option>
                        ))}
                      </select>
                    ) : (
                      item.categoria || "-"
                    )}
                  </td>

                  <td>
                    {editandoIndex === item.indiceOriginal ? (
                      <>
                        <select
                          value={formaPagamentoEditada}
                          onChange={(e) => {
                            setFormaPagamentoEditada(e.target.value);

                            if (e.target.value !== "Cartão de Crédito") {
                              setCartaoIdEditado("");
                              setParcelasEditadas("1");
                            }
                          }}
                        >
                          <option value="">Forma</option>
                          <option value="Dinheiro">Dinheiro</option>
                          <option value="Pix">Pix</option>
                          <option value="Débito">Débito</option>
                          <option value="Cartão de Crédito">
                            Cartão de Crédito
                          </option>
                          <option value="Boleto">Boleto</option>
                        </select>

                        {formaPagamentoEditada === "Cartão de Crédito" && (
                          <>
                            <select
                              value={cartaoIdEditado}
                              onChange={(e) =>
                                setCartaoIdEditado(e.target.value)
                              }
                            >
                              <option value="">Cartão</option>
                              {cartoes.map((cartao) => (
                                <option key={cartao.id} value={cartao.id}>
                                  {cartao.nome} - •••• {cartao.final_cartao}
                                </option>
                              ))}
                            </select>

                            <select
                              value={parcelasEditadas}
                              onChange={(e) =>
                                setParcelasEditadas(e.target.value)
                              }
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
                                (numero) => (
                                  <option key={numero} value={numero}>
                                    {numero}x
                                  </option>
                                )
                              )}
                            </select>
                          </>
                        )}
                      </>
                    ) : (
                      item.forma_pagamento || "-"
                    )}
                  </td>

                  <td>
                    {editandoIndex === item.indiceOriginal ? (
                      <input
                        type="text"
                        value={valorEditado}
                        onChange={(e) =>
                          setValorEditado(formatarMoeda(e.target.value))
                        }
                      />
                    ) : (
                      moeda(item.valor)
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
                <td colSpan="7">Nenhuma movimentação encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Movimentacoes;