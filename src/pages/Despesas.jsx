import { useState } from "react";

import Layout from "../components/Layout";
import "../styles/formulario.css";
import { useFinanceiro } from "../context/FinanceContext";

function Despesas() {
  const { adicionarMovimentacao } = useFinanceiro();

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [data, setData] = useState("");
  const [cartaoId, setCartaoId] = useState("");
  const [parcelas, setParcelas] = useState("1");

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

  function salvarDespesa(e) {
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

    adicionarMovimentacao(novaDespesa);

    if (formaPagamento === "Cartão de Crédito") {
      atualizarFaturaCartao(valorNumerico);
    }

    limparFormulario();

    setMensagem("Despesa cadastrada com sucesso!");
    setErro("");
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Despesas</h1>
        <p>Registre e controle seus gastos mensais.</p>
      </div>

      <div className="form-card">
        <h2>Nova Despesa</h2>

        {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}
        {erro && <p className="mensagem-erro">{erro}</p>}

        <form className="form-grid" onSubmit={salvarDespesa}>
          <input
            type="text"
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          <input
            type="text"
            placeholder="Ex: R$ 300,00"
            value={valor}
            onChange={(e) => setValor(formatarMoeda(e.target.value))}
          />

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Selecione a categoria</option>
            {categorias.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
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
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Boleto">Boleto</option>
          </select>

          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />

          {formaPagamento === "Cartão de Crédito" && (
            <>
              <select
                value={cartaoId}
                onChange={(e) => setCartaoId(e.target.value)}
              >
                <option value="">Selecione o cartão</option>
                {cartoes.map((cartao) => (
                  <option key={cartao.id} value={cartao.id}>
                    {cartao.nome} - •••• {cartao.final_cartao}
                  </option>
                ))}
              </select>

              <select
                value={parcelas}
                onChange={(e) => setParcelas(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((numero) => (
                  <option key={numero} value={numero}>
                    {numero}x
                  </option>
                ))}
              </select>
            </>
          )}

          <button type="submit">Salvar Despesa</button>
        </form>
      </div>
    </Layout>
  );
}

export default Despesas;