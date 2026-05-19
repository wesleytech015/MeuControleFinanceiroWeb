import Layout from "../components/Layout";
import "../styles/cartoes.css";

function Cartoes() {
  return (
    <Layout>
      <div className="page-header">
        <h1>Cartões</h1>
        <p>Controle seus cartões, limites e faturas.</p>
      </div>

      <section className="cartoes-grid">
        <div className="credit-card roxo">
          <div className="card-top">
            <span>Nubank</span>
            <strong>●●●● 4821</strong>
          </div>

          <h2>R$ 2.300</h2>
          <p>Fatura atual</p>

          <div className="card-bottom">
            <span>Limite: R$ 5.000</span>
            <span>Venc. 10/06</span>
          </div>
        </div>

        <div className="credit-card azul">
          <div className="card-top">
            <span>Inter</span>
            <strong>●●●● 7365</strong>
          </div>

          <h2>R$ 1.200</h2>
          <p>Limite utilizado</p>

          <div className="card-bottom">
            <span>Limite: R$ 4.000</span>
            <span>Venc. 15/06</span>
          </div>
        </div>

        <div className="credit-card verde">
          <div className="card-top">
            <span>PicPay</span>
            <strong>●●●● 9284</strong>
          </div>

          <h2>R$ 5.000</h2>
          <p>Limite disponível</p>

          <div className="card-bottom">
            <span>Limite: R$ 6.000</span>
            <span>Venc. 20/06</span>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default Cartoes;