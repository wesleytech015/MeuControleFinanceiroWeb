// IMPORTA O HOOK useState DO REACT
import { useState } from "react";

// IMPORTA O LAYOUT PADRÃO
import Layout from "../components/Layout";

// IMPORTA O CSS DO FORMULÁRIO
import "../styles/formulario.css";

// IMPORTA O CONTEXTO FINANCEIRO
import { useFinanceiro } from "../context/FinanceContext";

// COMPONENTE DA TELA DE DESPESAS
function Despesas() {
  // FUNÇÃO PARA ADICIONAR MOVIMENTAÇÃO
  const { adicionarMovimentacao } = useFinanceiro();

  // ESTADOS DO FORMULÁRIO
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [cartaoId, setCartaoId] = useState("");

  // LISTA TEMPORÁRIA DE CARTÕES
  // DEPOIS PODEMOS BUSCAR ESSA LISTA DO BACKEND
  const cartoes = [
    { id: 1, nome: "Nubank" },
    { id: 2, nome: "Inter" },
    { id: 3, nome: "Banco do Brasil" },
  ];

  // LISTA DE CATEGORIAS DE DESPESA
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

  // FORMATA VALOR PARA MOEDA BRASILEIRA
  function formatarMoeda(valorDigitado) {
    const somenteNumeros = valorDigitado.replace(/\D/g, "");

    return (Number(somenteNumeros) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // CONVERTE MOEDA FORMATADA PARA NÚMERO
  function converterMoedaParaNumero(valorFormatado) {
    return Number(
      valorFormatado
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim()
    );
  }

  // SALVA A DESPESA
  function salvarDespesa(e) {
    e.preventDefault();

    // VALIDAÇÃO DOS CAMPOS PRINCIPAIS
    if (
      descricao === "" ||
      valor === "" ||
      categoria === "" ||
      formaPagamento === ""
    ) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    // SE FOR CARTÃO DE CRÉDITO, O CARTÃO PRECISA SER INFORMADO
    if (formaPagamento === "Cartão de Crédito" && cartaoId === "") {
      alert("Selecione o cartão de crédito.");
      return;
    }

    // CRIA NOVA DESPESA
    const novaDespesa = {
      tipo: "Despesa",
      descricao,
      valor: converterMoedaParaNumero(valor),
      categoria,
      forma_pagamento: formaPagamento,
      cartao_id: formaPagamento === "Cartão de Crédito" ? Number(cartaoId) : null,
      data: new Date().toLocaleDateString("pt-BR"),
    };

    // ADICIONA NO CONTEXTO
    adicionarMovimentacao(novaDespesa);

    // LIMPA OS CAMPOS
    setDescricao("");
    setValor("");
    setCategoria("");
    setFormaPagamento("");
    setCartaoId("");

    alert("Despesa cadastrada com sucesso!");
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Despesas</h1>

        <p>Registre e controle seus gastos mensais.</p>
      </div>

      <div className="form-card">
        <h2>Nova Despesa</h2>

        <form className="form-grid" onSubmit={salvarDespesa}>
          <input
            type="text"
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          <input
            type="text"
            placeholder="Ex: R$ 3.000,00"
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

              // SE NÃO FOR CARTÃO DE CRÉDITO, REMOVE O CARTÃO SELECIONADO
              if (e.target.value !== "Cartão de Crédito") {
                setCartaoId("");
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

          {formaPagamento === "Cartão de Crédito" && (
            <select
              value={cartaoId}
              onChange={(e) => setCartaoId(e.target.value)}
            >
              <option value="">Selecione o cartão</option>

              {cartoes.map((cartao) => (
                <option key={cartao.id} value={cartao.id}>
                  {cartao.nome}
                </option>
              ))}
            </select>
          )}

          <button type="submit">Salvar Despesa</button>
        </form>
      </div>
    </Layout>
  );
}

// EXPORTA O COMPONENTE
export default Despesas;