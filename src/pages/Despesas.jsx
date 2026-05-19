import { useState } from "react";
import Layout from "../components/Layout";
import "../styles/formulario.css";
import { useFinanceiro } from "../context/FinanceContext";

function Despesas() {
  const { adicionarMovimentacao } = useFinanceiro();

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  function salvarDespesa(e) {
    e.preventDefault();

    if (descricao === "" || valor === "") {
      alert("Preencha todos os campos.");
      return;
    }

    const novaDespesa = {
      tipo: "Despesa",
      descricao: descricao,

      // CONVERTE 3.000,00 -> 3000.00
      valor: Number(
        valor
          .replace(/\./g, "")
          .replace(",", ".")
      ),

      data: new Date().toLocaleDateString("pt-BR"),
    };

    adicionarMovimentacao(novaDespesa);

    setDescricao("");
    setValor("");

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
            placeholder="Ex: 3.000,00"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />

          <button type="submit">
            Salvar Despesa
          </button>
        </form>
      </div>
    </Layout>
  );
}

export default Despesas;