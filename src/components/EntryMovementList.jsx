import { useContext, useState } from "react";

import FinanceIcon from "./FinanceIcon";
import { isCardsFeatureEnabled } from "../config/featureFlags.js";

import { FinanceContext } from "../context/financeContext.js";

function EntryMovementList({ tipo }) {
  const {
    movimentacoes,
    excluirMovimentacao,
    atualizarMovimentacao,
    carregando = false,
    erro: erroApi = "",
  } = useContext(FinanceContext);
  const cardsEnabled = isCardsFeatureEnabled();

  const [busca, setBusca] = useState("");
  const tipoFiltro = tipo;
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [editandoId, setEditandoId] = useState(null);
  const [descricaoEditada, setDescricaoEditada] = useState("");
  const [valorEditado, setValorEditado] = useState("");
  const [dataEditada, setDataEditada] = useState("");
  const [categoriaEditada, setCategoriaEditada] = useState("");
  const [formaPagamentoEditada, setFormaPagamentoEditada] = useState("");
  const [cartaoIdEditado, setCartaoIdEditado] = useState("");
  const [parcelasEditadas, setParcelasEditadas] = useState("1");

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const cartoes = cardsEnabled
    ? JSON.parse(localStorage.getItem("cartoes")) || []
    : [];

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
    if (!cardsEnabled || !cartaoId) return;

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

  function iniciarEdicao(item) {
    setEditandoId(item.id);
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

  async function salvarEdicao(id) {
    if (!descricaoEditada || !valorEditado || !dataEditada) {
      setErro("Preencha descrição, valor e data antes de salvar.");
      setMensagem("");
      return;
    }

    if (
      cardsEnabled &&
      formaPagamentoEditada === "Cartão de Crédito" &&
      !cartaoIdEditado
    ) {
      setErro("Selecione o cartão de crédito.");
      setMensagem("");
      return;
    }

    const movimentacaoAntiga = movimentacoes.find((item) => item.id === id);
    if (!movimentacaoAntiga) {
      setErro("A movimentação não está mais disponível para edição.");
      return;
    }

    const valorNovo = converterMoedaParaNumero(valorEditado);
    const valorAntigo = Number(movimentacaoAntiga.valor || 0);

    setErro("");
    setMensagem("");
    setSalvando(true);
    try {
      await atualizarMovimentacao(id, {
        tipo: movimentacaoAntiga.tipo,
        descricao: descricaoEditada,
        valor: valorNovo,
        data: converterDataParaBR(dataEditada),
        categoria: categoriaEditada,
        forma_pagamento: formaPagamentoEditada,
      });

      if (movimentacaoAntiga.forma_pagamento === "Cartão de Crédito") {
        atualizarFaturaCartao(movimentacaoAntiga.cartao_id, -valorAntigo);
      }
      if (formaPagamentoEditada === "Cartão de Crédito") {
        atualizarFaturaCartao(Number(cartaoIdEditado), valorNovo);
      }

      setEditandoId(null);
      setMensagem("Movimentação atualizada com sucesso!");
    } catch (error) {
      setErro(error.message || "Não foi possível atualizar a movimentação.");
    } finally {
      setSalvando(false);
    }
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setMensagem("");
    setErro("");
  }

  async function excluirItem(id) {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta movimentação?"
    );

    if (!confirmar) return;

    const movimentacaoExcluida = movimentacoes.find((item) => item.id === id);
    if (!movimentacaoExcluida) {
      setErro("A movimentação não está mais disponível para exclusão.");
      return;
    }

    setErro("");
    setMensagem("");
    setSalvando(true);
    try {
      await excluirMovimentacao(id);
      if (movimentacaoExcluida.forma_pagamento === "Cartão de Crédito") {
        atualizarFaturaCartao(
          movimentacaoExcluida.cartao_id,
          -Number(movimentacaoExcluida.valor || 0)
        );
      }
      setMensagem("Movimentação excluída com sucesso.");
    } catch (error) {
      setErro(error.message || "Não foi possível excluir a movimentação.");
    } finally {
      setSalvando(false);
    }
  }

  const movimentacoesFiltradas = movimentacoes
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
    <section className="entry-list" aria-label={tipo === "Receita" ? "Receitas cadastradas" : "Despesas cadastradas"}>
      <div className="entry-list-heading"><div><h2>{tipo === "Receita" ? "Receitas cadastradas" : "Despesas cadastradas"}</h2><p>Consulte, edite e organize seus registros.</p></div><FinanceIcon name="list" /></div>
      {mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}
      {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
      {erroApi && !erro && (
        <p className="mensagem-erro">Não foi possível carregar: {erroApi}</p>
      )}

      <div className="filtros-card">
        <label className="entry-filter-field">Buscar descrição
        <input
          type="text"
          aria-label="Buscar por descrição" placeholder="Buscar por descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        </label>

        <div className="filtros-data">
          <label className="entry-filter-field">Data inicial
          <input
            type="date"
            aria-label="Data inicial" value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
          </label>

          <label className="entry-filter-field">Data final
          <input
            type="date"
            aria-label="Data final" value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
          </label>
        </div>
      </div>

      <div className="table-card" tabIndex={0} role="region" aria-label="Tabela de registros financeiros">
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

            {!carregando && erroApi && (
              <tr>
                <td colSpan="7" className="mensagem-erro">
                  Não foi possível carregar as movimentações.
                </td>
              </tr>
            )}

            {!carregando &&
              !erroApi &&
              movimentacoesFiltradas.map((item) => (
                <tr key={item.id}>
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
                    {editandoId === item.id ? (
                      <input
                        type="text"
                        aria-label="Descrição" value={descricaoEditada}
                        onChange={(e) =>
                          setDescricaoEditada(e.target.value)
                        }
                      />
                    ) : (
                      item.descricao
                    )}
                  </td>

                  <td>
                    {editandoId === item.id ? (
                      <select
                        aria-label="Categoria" value={categoriaEditada}
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
                    {editandoId === item.id ? (
                      <>
                        <select
                          aria-label="Forma de pagamento" value={formaPagamentoEditada}
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
                          {(cardsEnabled ||
                            formaPagamentoEditada === "Cartão de Crédito") && (
                            <option
                              value="Cartão de Crédito"
                              disabled={!cardsEnabled}
                            >
                              {cardsEnabled
                                ? "Cartão de Crédito"
                                : "Cartão de Crédito (registro existente)"}
                            </option>
                          )}
                          <option value="Boleto">Boleto</option>
                        </select>

                        {cardsEnabled &&
                          formaPagamentoEditada === "Cartão de Crédito" && (
                          <>
                            <select
                              aria-label="Cartão" value={cartaoIdEditado}
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
                              aria-label="Parcelas" value={parcelasEditadas}
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
                    {editandoId === item.id ? (
                      <input
                        type="text"
                        aria-label="Valor" value={valorEditado}
                        onChange={(e) =>
                          setValorEditado(formatarMoeda(e.target.value))
                        }
                      />
                    ) : (
                      moeda(item.valor)
                    )}
                  </td>

                  <td>
                    {editandoId === item.id ? (
                      <input
                        type="date"
                        aria-label="Data" value={dataEditada}
                        onChange={(e) => setDataEditada(e.target.value)}
                      />
                    ) : (
                      item.data
                    )}
                  </td>

                  <td>
                    {editandoId === item.id ? (
                      <>
                        <button
                          className="btn-edit"
                          onClick={() => salvarEdicao(item.id)}
                          disabled={salvando}
                        >
                          Salvar
                        </button>

                        <button
                          className="btn-delete"
                          onClick={cancelarEdicao}
                          disabled={salvando}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-edit"
                          aria-label={`Editar ${item.descricao}`}
                          onClick={() => iniciarEdicao(item)}
                          disabled={salvando}
                        >
                          <FinanceIcon name="edit" /> Editar
                        </button>

                        <button
                          className="btn-delete"
                          aria-label={`Excluir ${item.descricao}`}
                          onClick={() => excluirItem(item.id)}
                          disabled={salvando}
                        >
                          <FinanceIcon name="trash" /> Excluir
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

            {!carregando &&
              !erroApi &&
              movimentacoesFiltradas.length === 0 && (
              <tr>
                <td colSpan="7">Nenhuma movimentação encontrada.</td>
              </tr>
              )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default EntryMovementList;
