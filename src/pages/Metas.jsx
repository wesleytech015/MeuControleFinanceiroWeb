// IMPORTA OS HOOKS DO REACT
import { useEffect, useState } from "react";

// IMPORTA O COMPONENTE DE LAYOUT
import Layout from "../components/Layout";

// IMPORTA O CSS DA PÁGINA
import "../styles/metas.css";

// COMPONENTE DA TELA DE METAS
function Metas() {

  // LISTA DE METAS SALVAS
  const [metas, setMetas] = useState(() => {
    const metasSalvas = localStorage.getItem("metas");
    return metasSalvas ? JSON.parse(metasSalvas) : [];
  });

  // CAMPOS DO FORMULÁRIO DE NOVA META
  const [titulo, setTitulo] = useState("");
  const [valorAtual, setValorAtual] = useState("");
  const [valorMeta, setValorMeta] = useState("");

  // VALORES TEMPORÁRIOS PARA ADICIONAR EM CADA META
  const [valoresAdicionais, setValoresAdicionais] = useState({});

  // SALVA AS METAS NO NAVEGADOR SEMPRE QUE A LISTA MUDA
  useEffect(() => {
    localStorage.setItem("metas", JSON.stringify(metas));
  }, [metas]);

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

  // ADICIONA NOVA META
  function adicionarMeta(event) {
    event.preventDefault();

    const valorAtualNumerico = converterMoedaParaNumero(valorAtual);
    const valorMetaNumerico = converterMoedaParaNumero(valorMeta);

    if (
      !titulo ||
      !valorAtual ||
      !valorMeta ||
      valorAtualNumerico <= 0 ||
      valorMetaNumerico <= 0
    ) {
      alert("Preencha todos os campos corretamente.");
      return;
    }

    const porcentagem = (valorAtualNumerico / valorMetaNumerico) * 100;

    const novaMeta = {
      id: Date.now(),
      titulo,
      valorAtual: valorAtualNumerico,
      valorMeta: valorMetaNumerico,
      porcentagem: Math.min(porcentagem, 100),
    };

    setMetas([...metas, novaMeta]);

    setTitulo("");
    setValorAtual("");
    setValorMeta("");
  }

  // ATUALIZA O CAMPO DE VALOR ADICIONAL DA META
  function alterarValorAdicional(id, valorDigitado) {
    setValoresAdicionais({
      ...valoresAdicionais,
      [id]: formatarMoeda(valorDigitado),
    });
  }

  // ADICIONA VALOR A UMA META EXISTENTE
  function adicionarValorMeta(id) {
    const valorFormatado = valoresAdicionais[id];

    if (!valorFormatado) {
      alert("Digite um valor para adicionar.");
      return;
    }

    const valorNumerico = converterMoedaParaNumero(valorFormatado);

    if (valorNumerico <= 0) {
      alert("Digite um valor válido.");
      return;
    }

    const metasAtualizadas = metas.map((meta) => {
      if (meta.id !== id) {
        return meta;
      }

      const novoValorAtual = meta.valorAtual + valorNumerico;

      const novaPorcentagem =
        (novoValorAtual / meta.valorMeta) * 100;

      return {
        ...meta,
        valorAtual: novoValorAtual,
        porcentagem: Math.min(novaPorcentagem, 100),
      };
    });

    setMetas(metasAtualizadas);

    setValoresAdicionais({
      ...valoresAdicionais,
      [id]: "",
    });
  }

  // EXCLUI UMA META
  function excluirMeta(id) {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta meta?"
    );

    if (!confirmar) {
      return;
    }

    const metasAtualizadas = metas.filter(
      (meta) => meta.id !== id
    );

    setMetas(metasAtualizadas);
  }

  return (
    <Layout>
      <div className="page-container">
        <h1>Metas</h1>

        <p className="page-subtitle">
          Acompanhe seus objetivos financeiros.
        </p>

        {/* FORMULÁRIO DE CADASTRO */}
        <form className="meta-form" onSubmit={adicionarMeta}>
          <input
            type="text"
            placeholder="Nome da meta"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <input
            type="text"
            placeholder="Valor atual"
            value={valorAtual}
            onChange={(e) =>
              setValorAtual(formatarMoeda(e.target.value))
            }
          />

          <input
            type="text"
            placeholder="Valor da meta"
            value={valorMeta}
            onChange={(e) =>
              setValorMeta(formatarMoeda(e.target.value))
            }
          />

          <button type="submit">
            Adicionar meta
          </button>
        </form>

        {/* LISTA DE METAS */}
        <div className="metas-grid">
          {metas.length === 0 ? (
            <div className="meta-card">
              <div className="meta-header">
                <h3>Nenhuma meta cadastrada</h3>
                <span className="meta-percent">0%</span>
              </div>

              <p>R$ 0,00 de R$ 0,00</p>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: "0%" }}
                ></div>
              </div>
            </div>
          ) : (
            metas.map((meta) => (
              <div className="meta-card" key={meta.id}>
                <div className="meta-header">
                  <h3>{meta.titulo}</h3>

                  <span className="meta-percent">
                    {meta.porcentagem.toFixed(0)}%
                  </span>
                </div>

                <p>
                  {meta.valorAtual.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}

                  {" de "}

                  {meta.valorMeta.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${meta.porcentagem}%`,
                    }}
                  ></div>
                </div>

                {/* CAMPO PARA ADICIONAR VALOR */}
                <input
                  className="input-adicionar-valor"
                  type="text"
                  placeholder="Valor para adicionar"
                  value={valoresAdicionais[meta.id] || ""}
                  onChange={(e) =>
                    alterarValorAdicional(meta.id, e.target.value)
                  }
                />

                {/* ÁREA DOS BOTÕES */}
                <div className="meta-actions">
                  <button
                    className="btn-adicionar-valor"
                    onClick={() => adicionarValorMeta(meta.id)}
                  >
                    Adicionar valor
                  </button>

                  <button
                    className="btn-excluir-meta"
                    onClick={() => excluirMeta(meta.id)}
                  >
                    Excluir meta
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

// EXPORTA O COMPONENTE
export default Metas;