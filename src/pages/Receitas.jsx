// IMPORTA useState DO REACT
import { useState } from "react";

// IMPORTA O LAYOUT PADRÃO
import Layout from "../components/Layout";

// IMPORTA O CSS
import "../styles/formulario.css";

// IMPORTA O CONTEXTO FINANCEIRO
import { useFinanceiro } from "../context/FinanceContext";

// COMPONENTE DA TELA DE RECEITAS
function Receitas() {

  // FUNÇÃO DO CONTEXTO
  const { adicionarMovimentacao } = useFinanceiro();

  // ESTADO DA DESCRIÇÃO
  const [descricao, setDescricao] = useState("");

  // ESTADO DO VALOR
  const [valor, setValor] = useState("");

  // FORMATA VALOR EM REAL
  function formatarMoeda(valorDigitado) {

    // REMOVE TUDO QUE NÃO FOR NÚMERO
    const somenteNumeros =
      valorDigitado.replace(/\D/g, "");

    // CONVERTE PARA MOEDA BRASILEIRA
    return (
      Number(somenteNumeros) / 100
    ).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  // SALVA RECEITA
  function salvarReceita(e) {

    // EVITA RECARREGAR A PÁGINA
    e.preventDefault();

    // VALIDA CAMPOS
    if (descricao === "" || valor === "") {

      alert("Preencha todos os campos.");

      return;
    }

    // CRIA NOVA RECEITA
    const novaReceita = {

      tipo: "Receita",

      descricao: descricao,

      // CONVERTE TEXTO FORMATADO PARA NÚMERO
      valor: Number(
        valor
          .replace("R$", "")
          .replace(/\./g, "")
          .replace(",", ".")
      ),

      // DATA ATUAL
      data: new Date().toLocaleDateString("pt-BR"),
    };

    // ADICIONA MOVIMENTAÇÃO
    adicionarMovimentacao(novaReceita);

    // LIMPA CAMPOS
    setDescricao("");
    setValor("");

    // ALERTA
    alert("Receita cadastrada com sucesso!");
  }

  return (

    <Layout>

      {/* CABEÇALHO */}
      <div className="page-header">

        <h1>Receitas</h1>

        <p>
          Cadastre e acompanhe suas entradas financeiras.
        </p>

      </div>

      {/* CARD DO FORMULÁRIO */}
      <div className="form-card">

        <h2>Nova Receita</h2>

        {/* FORMULÁRIO */}
        <form
          className="form-grid"
          onSubmit={salvarReceita}
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
            placeholder="Ex: R$ 10.000,00"
            value={valor}

            // FORMATA ENQUANTO DIGITA
            onChange={(e) =>
              setValor(
                formatarMoeda(e.target.value)
              )
            }
          />

          {/* BOTÃO */}
          <button type="submit">

            Salvar Receita

          </button>

        </form>

      </div>

    </Layout>
  );
}

// EXPORTA COMPONENTE
export default Receitas;