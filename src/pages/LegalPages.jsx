import { Link } from "react-router-dom";
import "../styles/legal.css";

const contactEmail = "eliezercosta.ti@gmail.com";
const effectiveDate = "Vigente a partir da publicação desta versão.";

function LegalLayout({ title, description, children }) {
  return (
    <div className="legal-page">
      <a className="legal-skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className="legal-header">
        <Link className="legal-brand" to="/" aria-label="Meu Controle Financeiro - início">
          Meu Controle Financeiro
        </Link>
        <nav aria-label="Documentos legais">
          <Link to="/privacidade">Privacidade</Link>
          <Link to="/termos">Termos</Link>
          <Link to="/exclusao-de-dados">Exclusão de dados</Link>
        </nav>
      </header>

      <main className="legal-content" id="conteudo">
        <p className="legal-eyebrow">Meu Controle Financeiro</p>
        <h1>{title}</h1>
        <p className="legal-description">{description}</p>
        <p className="legal-updated">{effectiveDate}</p>
        <div className="legal-body">{children}</div>
      </main>

      <footer className="legal-footer">
        <span>Contato: <a href={`mailto:${contactEmail}`}>{contactEmail}</a></span>
        <Link to="/">Voltar ao início</Link>
      </footer>
    </div>
  );
}

export function PoliticaDePrivacidade() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      description="Saiba quais informações são tratadas pelo serviço, para que são usadas e como pedir ajuda."
    >
      <section>
        <h2>Quem é responsável pelos dados</h2>
        <p>
          O serviço é apresentado publicamente como Meu Controle Financeiro.
          Esse é o nome do projeto e não identifica, por si só, uma razão social
          ou pessoa jurídica. Para assuntos de privacidade, escreva para{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
      </section>
      <section>
        <h2>Informações tratadas</h2>
        <ul>
          <li>
            No cadastro: nome, endereço de e-mail e credenciais de acesso. A
            senha e, quando habilitada, a palavra-chave de recuperação são
            armazenadas como hashes, não em texto simples.
          </li>
          <li>
            No uso do controle financeiro: descrição, valor, tipo, data,
            categoria e forma de pagamento das movimentações que você registra.
          </li>
          <li>
            No navegador: token de sessão e dados básicos da conta; metas e
            informações de cartões ficam no armazenamento local do navegador e
            não são sincronizadas com a conta ou com outros dispositivos.
          </li>
          <li>
            Dados técnicos necessários para a conexão e o funcionamento da
            aplicação podem ser tratados pelos provedores de hospedagem.
          </li>
        </ul>
      </section>
      <section>
        <h2>Como usamos e armazenamos as informações</h2>
        <p>
          Usamos os dados para criar e proteger sua conta, permitir o registro
          e a exibição das movimentações, manter a sessão e oferecer os recursos
          disponíveis no serviço. As movimentações da conta são processadas pela
          API e armazenadas no banco de dados do serviço. Metas, dados de cartões
          e sessão mantidos no navegador permanecem nesse dispositivo e podem
          ser removidos nas configurações de armazenamento do navegador.
        </p>
        <p>
          A aplicação usa provedores de infraestrutura para hospedar o site, a
          API e o banco de dados. Esses provedores podem tratar dados técnicos
          necessários à prestação desses serviços, de acordo com seus próprios
          termos e políticas.
        </p>
      </section>
      <section>
        <h2>Compartilhamento e segurança</h2>
        <p>
          Não comercializamos seus dados pessoais. O acesso às informações é
          limitado ao funcionamento do serviço e aos provedores de infraestrutura
          envolvidos. Senhas são protegidas por hash no servidor; ainda assim,
          nenhum serviço conectado à internet pode garantir segurança absoluta.
          Mantenha sua senha em sigilo e encerre sua sessão em dispositivos
          compartilhados.
        </p>
      </section>
      <section>
        <h2>Seus direitos e retenção</h2>
        <p>
          Você pode solicitar informações, correção ou exclusão de dados pelo
          e-mail de contato. No momento, não há um prazo de retenção publicamente
          definido nem uma exclusão automática da conta no site. Pedidos serão
          avaliados individualmente; informações que precisem ser mantidas por
          obrigação legal ou para exercício regular de direitos poderão ser
          preservadas nos limites aplicáveis.
        </p>
      </section>
      <section>
        <h2>Atualizações</h2>
        <p>
          Esta política pode ser atualizada quando o serviço ou suas práticas
          mudarem. A versão vigente será publicada nesta página.
        </p>
      </section>
    </LegalLayout>
  );
}

export function TermosDeServico() {
  return (
    <LegalLayout
      title="Termos de Serviço"
      description="Condições básicas para usar o Meu Controle Financeiro."
    >
      <section>
        <h2>Sobre o serviço</h2>
        <p>
          O Meu Controle Financeiro é uma ferramenta para registrar e acompanhar
          informações de receitas, despesas e planejamento pessoal. Os recursos
          podem mudar ou ficar temporariamente indisponíveis durante manutenção
          ou evolução do serviço.
        </p>
      </section>
      <section>
        <h2>Uso da conta</h2>
        <p>
          Ao criar uma conta, forneça informações verdadeiras e mantenha suas
          credenciais em segurança. Você é responsável pelas atividades feitas
          na sua conta e por usar o serviço de forma lícita, sem tentar acessar
          dados de outras pessoas, comprometer a aplicação ou utilizá-la para
          fins fraudulentos.
        </p>
      </section>
      <section>
        <h2>Informações financeiras</h2>
        <p>
          Os valores e relatórios dependem dos dados que você inserir. Confira
          os lançamentos e mantenha cópias das informações importantes. O
          serviço é uma ferramenta de organização e não constitui aconselhamento
          financeiro, contábil, jurídico ou de investimentos.
        </p>
      </section>
      <section>
        <h2>Disponibilidade e responsabilidade</h2>
        <p>
          O serviço é disponibilizado no estado em que se encontra, sem promessa
          de funcionamento ininterrupto ou de adequação a uma finalidade
          específica. Na medida permitida pela legislação, o usuário deve manter
          cópias próprias dos dados necessários e verificar as informações
          antes de tomar decisões financeiras.
        </p>
      </section>
      <section>
        <h2>Privacidade e encerramento</h2>
        <p>
          O tratamento de dados pessoais está descrito na{" "}
          <Link to="/privacidade">Política de Privacidade</Link>. Para solicitar
          a exclusão de dados ou tirar dúvidas, consulte a página de{" "}
          <Link to="/exclusao-de-dados">Exclusão de Dados</Link> ou escreva para{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
      </section>
      <section>
        <h2>Alterações destes termos</h2>
        <p>
          Estes termos podem ser atualizados para refletir mudanças no serviço
          ou na legislação. A versão publicada nesta página é a que deve ser
          consultada durante o uso.
        </p>
      </section>
    </LegalLayout>
  );
}

export function ExclusaoDeDados() {
  return (
    <LegalLayout
      title="Exclusão de Dados"
      description="Veja como solicitar a exclusão dos dados associados à sua conta."
    >
      <section>
        <h2>Como fazer uma solicitação</h2>
        <p>
          Envie um e-mail para{" "}
          <a href={`mailto:${contactEmail}?subject=Solicita%C3%A7%C3%A3o%20de%20exclus%C3%A3o%20de%20dados`}>
            {contactEmail}
          </a>{" "}
          com o assunto <strong>Solicitação de exclusão de dados</strong>.
          Envie a mensagem do endereço cadastrado e informe o nome da conta.
          Não inclua sua senha nem dados completos de cartão.
        </p>
        <p>
          Para proteger sua conta, poderá ser necessário confirmar que você é
          titular antes de tratar o pedido. A equipe responderá pelo mesmo
          endereço de e-mail para orientar e confirmar as próximas etapas.
        </p>
      </section>
      <section>
        <h2>O que acontece com o pedido</h2>
        <p>
          A exclusão de conta não está disponível automaticamente na aplicação
          e ainda não há um prazo de atendimento definido publicamente. Após a
          confirmação de titularidade, o pedido será analisado e a resposta
          informará o tratamento aplicável. Dados que precisem ser mantidos por
          obrigação legal ou para exercício regular de direitos poderão ser
          preservados nos limites aplicáveis.
        </p>
      </section>
      <section>
        <h2>Dados salvos neste navegador</h2>
        <p>
          Metas, informações de cartões e dados de sessão são mantidos no
          armazenamento local do navegador. Para removê-los deste dispositivo,
          saia da conta e apague os dados do site nas configurações do navegador.
          Essa ação local não substitui um pedido de exclusão dos dados da conta
          armazenados no serviço.
        </p>
      </section>
    </LegalLayout>
  );
}
