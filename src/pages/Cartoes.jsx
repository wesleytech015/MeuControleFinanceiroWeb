// IMPORTA OS HOOKS DO REACT
import { useEffect, useState } from "react";

// IMPORTA O LAYOUT PADRÃO
import Layout from "../components/Layout";

// IMPORTA O CSS DA PÁGINA
import "../styles/cartoes.css";

// COMPONENTE DA TELA DE CARTÕES
function Cartoes() {
  const [cartoes, setCartoes] = useState(() => {
    const cartoesSalvos = localStorage.getItem("cartoes");
    return cartoesSalvos ? JSON.parse(cartoesSalvos) : [];
  });

  const [nome, setNome] = useState("");
  const [banco, setBanco] = useState("");
  const [limite, setLimite] = useState("");
  const [fatura, setFatura] = useState("");
  const [diaFechamento, setDiaFechamento] = useState("");
  const [diaVencimento, setDiaVencimento] = useState("");
  const [finalCartao, setFinalCartao] = useState("");
  const [cor, setCor] = useState("roxo");

  const [cartaoEditandoId, setCartaoEditandoId] = useState(null);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    localStorage.setItem("cartoes", JSON.stringify(cartoes));
  }, [cartoes]);

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

  function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const totalLimite = cartoes.reduce(
    (total, cartao) => total + Number(cartao.limite || 0),
    0
  );

  const totalFatura = cartoes.reduce(
    (total, cartao) => total + Number(cartao.fatura || 0),
    0
  );

  const totalDisponivel = totalLimite - totalFatura;

  function limparFormulario() {
    setNome("");
    setBanco("");
    setLimite("");
    setFatura("");
    setDiaFechamento("");
    setDiaVencimento("");
    setFinalCartao("");
    setCor("roxo");
    setCartaoEditandoId(null);
  }

  function validarFormulario() {
    if (
      !nome ||
      !banco ||
      !limite ||
      !fatura ||
      !diaFechamento ||
      !diaVencimento ||
      !finalCartao
    ) {
      setErro("Preencha todos os campos.");
      setMensagem("");
      return false;
    }

    if (finalCartao.length !== 4) {
      setErro("O final do cartão deve ter exatamente 4 dígitos.");
      setMensagem("");
      return false;
    }

    if (converterMoedaParaNumero(limite) <= 0) {
      setErro("O limite do cartão deve ser maior que zero.");
      setMensagem("");
      return false;
    }

    if (converterMoedaParaNumero(fatura) > converterMoedaParaNumero(limite)) {
      setErro("A fatura não pode ser maior que o limite do cartão.");
      setMensagem("");
      return false;
    }

    return true;
  }

  function salvarCartao(event) {
    event.preventDefault();

    if (!validarFormulario()) return;

    if (cartaoEditandoId) {
      const cartoesAtualizados = cartoes.map((cartao) =>
        cartao.id === cartaoEditandoId
          ? {
              ...cartao,
              nome,
              banco,
              limite: converterMoedaParaNumero(limite),
              fatura: converterMoedaParaNumero(fatura),
              dia_fechamento: diaFechamento,
              dia_vencimento: diaVencimento,
              final_cartao: finalCartao,
              cor,
            }
          : cartao
      );

      setCartoes(cartoesAtualizados);
      limparFormulario();

      setMensagem("Cartão atualizado com sucesso!");
      setErro("");

      return;
    }

    const novoCartao = {
      id: Date.now(),
      nome,
      banco,
      limite: converterMoedaParaNumero(limite),
      fatura: converterMoedaParaNumero(fatura),
      dia_fechamento: diaFechamento,
      dia_vencimento: diaVencimento,
      final_cartao: finalCartao,
      cor,
    };

    setCartoes([...cartoes, novoCartao]);

    limparFormulario();

    setMensagem("Cartão cadastrado com sucesso!");
    setErro("");
  }

  function editarCartao(cartao) {
    setCartaoEditandoId(cartao.id);
    setNome(cartao.nome);
    setBanco(cartao.banco);
    setLimite(moeda(cartao.limite));
    setFatura(moeda(cartao.fatura));
    setDiaFechamento(cartao.dia_fechamento);
    setDiaVencimento(cartao.dia_vencimento);
    setFinalCartao(cartao.final_cartao);
    setCor(cartao.cor || "roxo");

    setMensagem("");
    setErro("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelarEdicao() {
    limparFormulario();
    setMensagem("Edição cancelada.");
    setErro("");
  }

  function excluirCartao(id) {
    const confirmar = window.confirm("Deseja realmente excluir este cartão?");

    if (!confirmar) return;

    const cartoesAtualizados = cartoes.filter((cartao) => cartao.id !== id);

    setCartoes(cartoesAtualizados);

    if (cartaoEditandoId === id) {
      limparFormulario();
    }

    setMensagem("Cartão excluído com sucesso.");
    setErro("");
  }

  return (
    <Layout>
      <div className="page-container">
        <h1>Cartões</h1>

        <p className="page-subtitle">
          Controle seus cartões, limites, fechamento e vencimento da fatura.
        </p>

        <div className="resumo-cartoes">
          <div className="resumo-card">
            <h3>{cartoes.length}</h3>
            <span>Cartões</span>
          </div>

          <div className="resumo-card">
            <h3>{moeda(totalLimite)}</h3>
            <span>Limite Total</span>
          </div>

          <div className="resumo-card">
            <h3>{moeda(totalDisponivel)}</h3>
            <span>Disponível</span>
          </div>
        </div>

        {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}
        {erro && <p className="mensagem-erro">{erro}</p>}

        <form className="cartao-form" onSubmit={salvarCartao}>
          <input
            type="text"
            placeholder="Nome do cartão"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <input
            type="text"
            placeholder="Banco Ex: Nubank"
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
          />

          <input
            type="text"
            placeholder="Limite Ex: R$ 5.000,00"
            value={limite}
            onChange={(e) => setLimite(formatarMoeda(e.target.value))}
          />

          <input
            type="text"
            placeholder="Fatura atual Ex: R$ 500,00"
            value={fatura}
            onChange={(e) => setFatura(formatarMoeda(e.target.value))}
          />

          <input
            type="number"
            placeholder="Dia de fechamento Ex: 20"
            min="1"
            max="31"
            value={diaFechamento}
            onChange={(e) => setDiaFechamento(e.target.value)}
          />

          <input
            type="number"
            placeholder="Dia de vencimento Ex: 27"
            min="1"
            max="31"
            value={diaVencimento}
            onChange={(e) => setDiaVencimento(e.target.value)}
          />

          <input
            type="text"
            placeholder="Final do cartão"
            maxLength="4"
            value={finalCartao}
            onChange={(e) =>
              setFinalCartao(e.target.value.replace(/\D/g, ""))
            }
          />

          <select value={cor} onChange={(e) => setCor(e.target.value)}>
            <option value="roxo">Roxo</option>
            <option value="azul">Azul</option>
            <option value="verde">Verde</option>
          </select>

          <button type="submit">
            {cartaoEditandoId ? "Atualizar cartão" : "Cadastrar cartão"}
          </button>

          {cartaoEditandoId && (
            <button
              type="button"
              className="btn-cancelar-cartao"
              onClick={cancelarEdicao}
            >
              Cancelar edição
            </button>
          )}
        </form>

        <div className="cartoes-grid">
          {cartoes.length === 0 ? (
            <p>Nenhum cartão cadastrado.</p>
          ) : (
            cartoes.map((cartao) => {
              const limiteDisponivel =
                Number(cartao.limite || 0) - Number(cartao.fatura || 0);

              return (
                <div
                  key={cartao.id}
                  className={`credit-card ${cartao.cor || "roxo"} ${
                    cartao.id === cartaoEditandoId ? "editing" : ""
                  }`}
                >
                  <div className="card-top">
                    <span>{cartao.nome}</span>
                    <span>•••• {cartao.final_cartao}</span>
                  </div>

                  <small>{cartao.banco}</small>

                  <h2>{moeda(cartao.fatura)}</h2>

                  <p>Fatura atual</p>

                  <div className="card-info">
                    <span>Limite: {moeda(cartao.limite)}</span>
                    <span>Disponível: {moeda(limiteDisponivel)}</span>
                    <span>Fecha dia {cartao.dia_fechamento}</span>
                    <span>Vence dia {cartao.dia_vencimento}</span>
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn-editar-cartao"
                      onClick={() => editarCartao(cartao)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn-excluir-cartao"
                      onClick={() => excluirCartao(cartao.id)}
                    >
                      Excluir cartão
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Cartoes;