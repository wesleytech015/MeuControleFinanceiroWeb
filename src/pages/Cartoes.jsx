// IMPORTA OS HOOKS DO REACT
import { useEffect, useState } from "react";

// IMPORTA O LAYOUT PADRÃO
import Layout from "../components/Layout";

// IMPORTA O CSS DA PÁGINA
import "../styles/cartoes.css";

// COMPONENTE DA TELA DE CARTÕES
function Cartoes() {

  // BUSCA OS CARTÕES SALVOS NO NAVEGADOR
  const [cartoes, setCartoes] = useState(() => {
    const cartoesSalvos = localStorage.getItem("cartoes");
    return cartoesSalvos ? JSON.parse(cartoesSalvos) : [];
  });

  // CAMPOS DO FORMULÁRIO
  const [nome, setNome] = useState("");
  const [limite, setLimite] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [finalCartao, setFinalCartao] = useState("");

  // SALVA OS CARTÕES SEMPRE QUE A LISTA MUDA
  useEffect(() => {
    localStorage.setItem("cartoes", JSON.stringify(cartoes));
  }, [cartoes]);

  // FORMATA VALOR PARA PADRÃO BRASILEIRO
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

  // CADASTRA UM NOVO CARTÃO
  function cadastrarCartao(event) {
    event.preventDefault();

    if (!nome || !limite || !vencimento || !finalCartao) {
      alert("Preencha todos os campos.");
      return;
    }

    const novoCartao = {
      id: Date.now(),
      nome,
      limite: converterMoedaParaNumero(limite),
      vencimento,
      finalCartao,
      fatura: 0,
    };

    setCartoes([...cartoes, novoCartao]);

    setNome("");
    setLimite("");
    setVencimento("");
    setFinalCartao("");
  }

  // EXCLUI UM CARTÃO
  function excluirCartao(id) {
    const confirmar = window.confirm(
      "Deseja realmente excluir este cartão?"
    );

    if (!confirmar) {
      return;
    }

    const cartoesAtualizados = cartoes.filter(
      (cartao) => cartao.id !== id
    );

    setCartoes(cartoesAtualizados);
  }

  return (
    <Layout>
      <div className="page-container">
        <h1>Cartões</h1>

        <p className="page-subtitle">
          Controle seus cartões, limites e faturas.
        </p>

        {/* FORMULÁRIO DE CADASTRO */}
        <form className="cartao-form" onSubmit={cadastrarCartao}>
          <input
            type="text"
            placeholder="Nome do cartão"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Limite Ex: R$ 5.000,00"
            value={limite}
            onChange={(e) =>
              setLimite(formatarMoeda(e.target.value))
            }
            required
          />

          <input
            type="text"
            placeholder="Vencimento Ex: 15/06/2026"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Final do cartão"
            maxLength="4"
            value={finalCartao}
            onChange={(e) => setFinalCartao(e.target.value)}
            required
          />

          <button type="submit">
            Cadastrar cartão
          </button>
        </form>

        {/* LISTA DE CARTÕES */}
        <div className="cartoes-grid">
          {cartoes.length === 0 ? (
            <p>Nenhum cartão cadastrado.</p>
          ) : (
            cartoes.map((cartao, index) => (
              <div
                key={cartao.id}
                className={`credit-card ${
                  index % 3 === 0
                    ? "roxo"
                    : index % 3 === 1
                    ? "azul"
                    : "verde"
                }`}
              >
                {/* TOPO DO CARTÃO */}
                <div className="card-top">
                  <span>{cartao.nome}</span>
                  <span>•••• {cartao.finalCartao}</span>
                </div>

                {/* FATURA ATUAL */}
                <h2>
                  {cartao.fatura.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </h2>

                <p>Fatura atual</p>

                {/* RODAPÉ DO CARTÃO */}
                <div className="card-bottom">
                  <span>
                    Limite:{" "}
                    {cartao.limite.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>

                  <span>
                    Venc. {cartao.vencimento}
                  </span>
                </div>

                {/* BOTÃO EXCLUIR */}
                <button
                  className="btn-excluir-cartao"
                  onClick={() => excluirCartao(cartao.id)}
                >
                  Excluir cartão
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

// EXPORTA O COMPONENTE
export default Cartoes;