import EntryPageHeader from "../components/EntryPageHeader";
import EntryMovementList from "../components/EntryMovementList";
import "../styles/entries.css";
import { useContext, useState } from "react";

import Layout from "../components/Layout";
import { isCardsFeatureEnabled } from "../config/featureFlags.js";
import "../styles/formulario.css";
import { FinanceContext } from "../context/financeContext.js";

function Despesas() {
  const {
    movimentacoes,
    adicionarMovimentacao,
    carregando,
    erro: erroApi,
  } = useContext(FinanceContext);
  const cardsEnabled = isCardsFeatureEnabled();

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [data, setData] = useState("");
  const [cartaoId, setCartaoId] = useState("");
  const [parcelas, setParcelas] = useState("1");

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
      valorFormatado
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim()
    );
  }

  function converterDataParaBR(dataISO) {
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function limparFormulario() {
    setDescricao("");
    setValor("");
    setCategoria("");
    setFormaPagamento("");
    setData("");
    setCartaoId("");
    setParcelas("1");
  }

  function atualizarFaturaCartao(valorDespesa) {
    if (!cardsEnabled) return;

    const cartoesSalvos = JSON.parse(localStorage.getItem("cartoes")) || [];

    const cartoesAtualizados = cartoesSalvos.map((cartao) =>
      cartao.id === Number(cartaoId)
        ? {
            ...cartao,
            fatura: Number(cartao.fatura || 0) + valorDespesa,
          }
        : cartao
    );

    localStorage.setItem("cartoes", JSON.stringify(cartoesAtualizados));
  }

  async function salvarDespesa(e) {
    e.preventDefault();

    if (!descricao || !valor || !categoria || !formaPagamento || !data) {
      setErro("Preencha todos os campos obrigatórios.");
      setMensagem("");
      return;
    }

    if (formaPagamento === "Cartão de Crédito" && !cartaoId) {
      setErro("Selecione o cartão de crédito.");
      setMensagem("");
      return;
    }

    if (!cardsEnabled && formaPagamento === "Cartão de Crédito") {
      setErro("Pagamento com cartão está indisponível nesta versão.");
      setMensagem("");
      return;
    }

    const valorNumerico = converterMoedaParaNumero(valor);

    const novaDespesa = {
      tipo: "Despesa",
      descricao,
      valor: valorNumerico,
      categoria,
      forma_pagamento: formaPagamento,
      cartao_id:
        formaPagamento === "Cartão de Crédito" ? Number(cartaoId) : null,
      parcelas:
        formaPagamento === "Cartão de Crédito" ? Number(parcelas) : 1,
      data: converterDataParaBR(data),
    };

    setErro("");
    setMensagem("");
    setSalvando(true);
    try {
      await adicionarMovimentacao(novaDespesa);
      if (formaPagamento === "Cartão de Crédito") {
        atualizarFaturaCartao(valorNumerico);
      }
      limparFormulario();
      setMensagem("Despesa cadastrada com sucesso!");
    } catch (error) {
      setErro(error.message || "Não foi possível cadastrar a despesa.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Layout>
      <div className="entries-page entries-expense">
      <EntryPageHeader tipo="Despesa" movimentacoes={movimentacoes} carregando={carregando} erro={erroApi} />

      <section className="form-card" id="entry-form" aria-labelledby="entry-form-title">
        <div className="entry-form-heading"><h2 id="entry-form-title">Nova Despesa</h2><p>Preencha os dados abaixo para registrar sua despesa.</p></div>

        {mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}
        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
        {erroApi && !erro && (
          <p className="mensagem-erro">
            A sincronização com a API falhou: {erroApi}
          </p>
        )}

        <form className="form-grid" aria-busy={salvando} onSubmit={salvarDespesa}>
          <div className="entry-field"><label className="entry-field-label" htmlFor="entry-descricao">Descrição</label><input id="entry-descricao"
            type="text"
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          /></div>

          <div className="entry-field"><label className="entry-field-label" htmlFor="entry-valor">Valor (R$)</label><input id="entry-valor"
            type="text" inputMode="decimal"
            placeholder="Ex: R$ 300,00"
            value={valor}
            onChange={(e) => setValor(formatarMoeda(e.target.value))}
          /></div>

          <div className="entry-field"><label className="entry-field-label" htmlFor="entry-categoria">Categoria</label><select id="entry-categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Selecione a categoria</option>
            {categorias.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select></div>

          <div className="entry-field"><label className="entry-field-label" htmlFor="entry-formaPagamento">Forma de pagamento</label><select id="entry-formaPagamento"
            value={formaPagamento}
            onChange={(e) => {
              setFormaPagamento(e.target.value);

              if (e.target.value !== "Cartão de Crédito") {
                setCartaoId("");
                setParcelas("1");
              }
            }}
          >
            <option value="">Forma de pagamento</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Pix">Pix</option>
            <option value="Débito">Débito</option>
            {cardsEnabled && (
              <option value="Cartão de Crédito">Cartão de Crédito</option>
            )}
            <option value="Boleto">Boleto</option>
          </select></div>

          <div className="entry-field"><label className="entry-field-label" htmlFor="entry-data">Data</label><input id="entry-data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          /></div>

          {cardsEnabled && formaPagamento === "Cartão de Crédito" && (
            <>
              <div className="entry-field"><label className="entry-field-label" htmlFor="entry-cartaoId">Cartão de crédito</label><select id="entry-cartaoId"
                value={cartaoId}
                onChange={(e) => setCartaoId(e.target.value)}
              >
                <option value="">Selecione o cartão</option>
                {cartoes.map((cartao) => (
                  <option key={cartao.id} value={cartao.id}>
                    {cartao.nome} - •••• {cartao.final_cartao}
                  </option>
                ))}
              </select></div>

              <div className="entry-field"><label className="entry-field-label" htmlFor="entry-parcelas">Parcelas</label><select id="entry-parcelas"
                value={parcelas}
                onChange={(e) => setParcelas(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((numero) => (
                  <option key={numero} value={numero}>
                    {numero}x
                  </option>
                ))}
              </select></div>
            </>
          )}

          <button type="submit" disabled={salvando || carregando}>
            {salvando ? "Salvando..." : "Salvar Despesa"}
          </button>
        </form>
      </section>
      <EntryMovementList tipo="Despesa" />
      </div>
    </Layout>
  );
}

export default Despesas;