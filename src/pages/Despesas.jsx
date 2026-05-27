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

  // ESTADO DA DESCRIÇÃO
  const [descricao, setDescricao] = useState("");

  // ESTADO DO VALOR
  const [valor, setValor] = useState("");

  // ESTADO DA FORMA DE PAGAMENTO
  const [formaPagamento, setFormaPagamento] = useState("");

  // ============================================
  // FORMATA VALOR PARA MOEDA BRASILEIRA
  // ============================================

  function formatarMoeda(valorDigitado) {

    // REMOVE TUDO QUE NÃO FOR NÚMERO
    const somenteNumeros = valorDigitado.replace(/\D/g, "");

    // CONVERTE PARA MOEDA BR
    return (Number(somenteNumeros) / 100).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  // ============================================
  // CONVERTE MOEDA FORMATADA PARA NÚMERO
  // ============================================

  function converterMoedaParaNumero(valorFormatado) {

    return Number(
      valorFormatado
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim()
    );
  }

  // ============================================
  // SALVA A DESPESA
  // ============================================

  function salvarDespesa(e) {

    // EVITA RECARREGAR A PÁGINA
    e.preventDefault();

    // VALIDA CAMPOS
    if (
      descricao === "" ||
      valor === "" ||
      formaPagamento === ""
    ) {

      alert("Preencha todos os campos.");
      return;
    }

    // OBJETO DA NOVA DESPESA
    const novaDespesa = {

      tipo: "Despesa",

      descricao,

      valor: converterMoedaParaNumero(valor),

      formaPagamento,

      data: new Date().toLocaleDateString("pt-BR"),
    };

    // ADICIONA MOVIMENTAÇÃO
    adicionarMovimentacao(novaDespesa);

    // LIMPA CAMPOS
    setDescricao("");
    setValor("");
    setFormaPagamento("");

    // ALERTA
    alert("Despesa cadastrada com sucesso!");
  }

  return (
    <Layout>

      {/* CABEÇALHO */}
      <div className="page-header">

        <h1>Despesas</h1>

        <p>
          Registre e controle seus gastos mensais.
        </p>

      </div>

      {/* CARD DO FORMULÁRIO */}
      <div className="form-card">

        <h2>Nova Despesa</h2>

        {/* FORMULÁRIO */}
        <form
          className="form-grid"
          onSubmit={salvarDespesa}
        >

          {/* CAMPO DESCRIÇÃO */}
          <input
            type="text"
            placeholder="Descrição"
            value={descricao}
            onChange={(e) =>
              setDescricao(e.target.value)
            }
          />

          {/* CAMPO VALOR */}
          <input
            type="text"
            placeholder="Ex: R$ 3.000,00"
            value={valor}
            onChange={(e) =>
              setValor(
                formatarMoeda(e.target.value)
              )
            }
          />

          {/* CAMPO FORMA DE PAGAMENTO */}
          <select
            value={formaPagamento}
            onChange={(e) =>
              setFormaPagamento(e.target.value)
            }
            required
          >

            {/* PLACEHOLDER */}
            <option
              value=""
              disabled
            >
              Forma de pagamento
            </option>

            {/* OPÇÕES */}
            <option value="Crédito">
              Crédito
            </option>

            <option value="Débito">
              Débito
            </option>

            <option value="Pix">
              Pix
            </option>

            <option value="Dinheiro em espécie">
              Dinheiro em espécie
            </option>

          </select>

          {/* BOTÃO */}
          <button type="submit">

            Salvar Despesa

          </button>

        </form>

      </div>

    </Layout>
  );
}

// EXPORTA O COMPONENTE
export default Despesas;