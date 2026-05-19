import { useState } from "react";
import Layout from "../components/Layout";
import "../styles/formulario.css";
import { useFinanceiro } from "../context/FinanceContext";

function Receitas() {
  const { adicionarMovimentacao } = useFinanceiro();

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  function salvarReceita(e) {
    e.preventDefault();

    if (descricao === "" || valor === "") {
      alert("Preencha todos os campos.");
      return;
    }

    const novaReceita = {
      tipo: "Receita",
      descricao: descricao,

      // CONVERTE 10.000,00 -> 10000.00
      valor: Number(
        valor
          .replace(/\./g, "")
          .replace(",", ".")
      ),

      data: new Date().toLocaleDateString("pt-BR"),
    };

    adicionarMovimentacao(novaReceita);

    setDescricao("");
    setValor("");

    alert("Receita cadastrada com sucesso!");
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Receitas</h1>
        <p>Cadastre e acompanhe suas entradas financeiras.</p>
      </div>

      <div className="form-card">
        <h2>Nova Receita</h2>

        <form className="form-grid" onSubmit={salvarReceita}>
          <input
            type="text"
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          <input
            type="text"
            placeholder="Ex: 10.000,00"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />

          <button type="submit">
            Salvar Receita
          </button>
        </form>
      </div>
    </Layout>
  );
}

export default Receitas;