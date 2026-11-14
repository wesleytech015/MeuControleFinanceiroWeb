import EntryPageHeader from "../components/EntryPageHeader";
import EntryMovementList from "../components/EntryMovementList";
import "../styles/entries.css";
// IMPORTA useState DO REACT
import { useContext, useState } from "react";

// IMPORTA O LAYOUT PADRÃO
import Layout from "../components/Layout";

// IMPORTA O CSS
import "../styles/formulario.css";

// IMPORTA O CONTEXTO FINANCEIRO
import { FinanceContext } from "../context/financeContext.js";

// COMPONENTE DA TELA DE RECEITAS
function Receitas() {

  // FUNÇÃO DO CONTEXTO
  const {
    movimentacoes,
    adicionarMovimentacao,
    carregando,
    erro: erroApi,
  } = useContext(FinanceContext);

  // ESTADO DA DESCRIÇÃO
  const [descricao, setDescricao] = useState("");

  // ESTADO DO VALOR
  const [valor, setValor] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

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
  async function salvarReceita(e) {

    // EVITA RECARREGAR A PÁGINA
    e.preventDefault();

    // VALIDA CAMPOS
    if (descricao === "" || valor === "") {

      setErro("Preencha todos os campos.");
      setMensagem("");

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

    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await adicionarMovimentacao(novaReceita);
      setDescricao("");
      setValor("");
      setMensagem("Receita cadastrada com sucesso!");
    } catch (error) {
      setErro(error.message || "Não foi possível cadastrar a receita.");
    } finally {
      setSalvando(false);
    }
  }

  return (

    <Layout>
      <div className="entries-page entries-income">

      {/* CABEÇALHO */}
      <EntryPageHeader tipo="Receita" movimentacoes={movimentacoes} carregando={carregando} erro={erroApi} />

      <section className="form-card" id="entry-form" aria-labelledby="entry-form-title">

        <div className="entry-form-heading"><h2 id="entry-form-title">Nova Receita</h2><p>Preencha os dados abaixo para registrar sua receita.</p></div>
        {mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}
        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
        {erroApi && !erro && (
          <p className="mensagem-erro">
            A sincronização com a API falhou: {erroApi}
          </p>
        )}

        {/* FORMULÁRIO */}
        <form
          className="form-grid" aria-busy={salvando}
          onSubmit={salvarReceita}
        >

          {/* CAMPO DESCRIÇÃO */}
          <div className="entry-field"><label className="entry-field-label" htmlFor="entry-descricao">Descrição</label><input id="entry-descricao"
            type="text"
            placeholder="Descrição"
            value={descricao}
            onChange={(e) =>
              setDescricao(e.target.value)
            }
          /></div>

          {/* CAMPO VALOR */}
          <div className="entry-field"><label className="entry-field-label" htmlFor="entry-valor">Valor (R$)</label><input id="entry-valor"
            type="text" inputMode="decimal"
            placeholder="Ex: R$ 10.000,00"
            value={valor}

            // FORMATA ENQUANTO DIGITA
            onChange={(e) =>
              setValor(
                formatarMoeda(e.target.value)
              )
            }
          /></div>

          {/* BOTÃO */}
          <button type="submit" disabled={salvando || carregando}>

            {salvando ? "Salvando..." : "Salvar Receita"}

          </button>

        </form>

      </section>
      <EntryMovementList tipo="Receita" />
      </div>

    </Layout>
  );
}

// EXPORTA COMPONENTE
export default Receitas;