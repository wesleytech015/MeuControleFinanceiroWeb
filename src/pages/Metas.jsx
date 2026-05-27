// IMPORTA OS HOOKS DO REACT
import { useEffect, useState } from "react";

// IMPORTA O COMPONENTE DE LAYOUT
import Layout from "../components/Layout";

// IMPORTA O CSS DA PÁGINA
import "../styles/metas.css";

// COMPONENTE DA TELA DE METAS
function Metas() {

  // ============================================
  // LISTA DE METAS
  // ============================================

  const [metas, setMetas] = useState(() => {

    // BUSCA METAS SALVAS
    const metasSalvas =
      localStorage.getItem("metas");

    // RETORNA DADOS OU ARRAY VAZIO
    return metasSalvas
      ? JSON.parse(metasSalvas)
      : [];
  });


  // ============================================
  // CAMPOS DO FORMULÁRIO
  // ============================================

  const [titulo, setTitulo] = useState("");
  const [valorAtual, setValorAtual] = useState("");
  const [valorMeta, setValorMeta] = useState("");


  // ============================================
  // SALVA NO LOCALSTORAGE
  // ============================================

  useEffect(() => {

    localStorage.setItem(
      "metas",
      JSON.stringify(metas)
    );

  }, [metas]);


  // ============================================
  // ADICIONA NOVA META
  // ============================================

  function adicionarMeta() {

    // VALIDAÇÃO
    if (
      !titulo ||
      !valorAtual ||
      !valorMeta
    ) {
      return;
    }

    // CALCULA A PORCENTAGEM
    const porcentagem =
      (Number(valorAtual) / Number(valorMeta)) * 100;

    // NOVA META
    const novaMeta = {

      id: Date.now(),

      titulo,

      valorAtual: Number(valorAtual),

      valorMeta: Number(valorMeta),

      porcentagem
    };

    // ADICIONA META NA LISTA
    setMetas([...metas, novaMeta]);

    // LIMPA CAMPOS
    setTitulo("");
    setValorAtual("");
    setValorMeta("");
  }


  return (

    // LAYOUT PRINCIPAL
    <Layout>

      {/* CONTAINER DA PÁGINA */}
      <div className="page-container">

        {/* TÍTULO */}
        <h1>Metas</h1>

        {/* SUBTÍTULO */}
        <p className="page-subtitle">
          Acompanhe seus objetivos financeiros.
        </p>


        {/* ============================================
            FORMULÁRIO DE CADASTRO
        ============================================ */}

        <div className="meta-form">

          <input
            type="text"
            placeholder="Nome da meta"
            value={titulo}
            onChange={(e) =>
              setTitulo(e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Valor atual"
            value={valorAtual}
            onChange={(e) =>
              setValorAtual(e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Valor da meta"
            value={valorMeta}
            onChange={(e) =>
              setValorMeta(e.target.value)
            }
          />

          <button onClick={adicionarMeta}>

            Adicionar meta

          </button>

        </div>


        {/* ============================================
            GRID DAS METAS
        ============================================ */}

        <div className="metas-grid">

          {metas.length === 0 ? (

            <div className="meta-card">

              <div className="meta-header">

                <h3>Nenhuma meta cadastrada</h3>

                <span className="meta-percent">

                  0%

                </span>

              </div>

              <p>

                R$ 0,00 de R$ 0,00

              </p>

              <div className="progress-bar">

                <div
                  className="progress-fill"
                  style={{ width: "0%" }}
                ></div>

              </div>

            </div>

          ) : (

            metas.map((meta) => (

              <div
                className="meta-card"
                key={meta.id}
              >

                {/* TOPO DO CARD */}
                <div className="meta-header">

                  <h3>{meta.titulo}</h3>

                  <span className="meta-percent">

                    {meta.porcentagem.toFixed(0)}%

                  </span>

                </div>


                {/* VALORES */}
                <p>

                  {meta.valorAtual.toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL"
                    }
                  )}

                  {" de "}

                  {meta.valorMeta.toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL"
                    }
                  )}

                </p>


                {/* BARRA DE PROGRESSO */}
                <div className="progress-bar">

                  <div
                    className="progress-fill"
                    style={{
                      width: `${meta.porcentagem}%`
                    }}
                  ></div>

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