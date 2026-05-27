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

  // FORMATA VALOR PARA MOEDA BRASILEIRA
  function formatarMoeda(valorDigitado) {

    // REMOVE TUDO QUE NÃO FOR NÚMERO
    const somenteNumeros = valorDigitado.replace(/\D/g, "");

    // CONVERTE PARA REAL
    return (Number(somenteNumeros) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // CONVERTE MOEDA FORMATADA PARA NÚMERO
  function converterMoedaParaNumero(valorFormatado) {

    // REMOVE R$, PONTOS E TROCA VÍRGULA POR PONTO
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

    // EVITA RECARREGAR A PÁGINA
    e.preventDefault();

    // VALIDA OS CAMPOS
    if (descricao === "" || valor === "") {
      alert("Preencha todos os campos.");
      return;
    }

    // CRIA NOVA DESPESA
    const novaDespesa = {
      tipo: "Despesa",
      descricao,
      valor: converterMoedaParaNumero(valor),
      data: new Date().toLocaleDateString("pt-BR"),
    };

    // ADICIONA NO CONTEXTO
    adicionarMovimentacao(novaDespesa);

    // LIMPA OS CAMPOS
    setDescricao("");
    setValor("");

    // CONFIRMA CADASTRO
    alert("Despesa cadastrada com sucesso!");
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Despesas</h1>

        <p>
          Registre e controle seus gastos mensais.
        </p>
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
            onChange={(e) =>
              setValor(formatarMoeda(e.target.value))
            }
          />

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