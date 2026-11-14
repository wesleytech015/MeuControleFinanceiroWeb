import { Link } from 'react-router-dom';

export default function RecoveryUnavailable() {
  return <div className="cadastro-card">
    <h1>Recuperação indisponível</h1>
    <p role="status">A recuperação de senha ainda não está disponível. Estamos trabalhando para disponibilizar essa funcionalidade em breve.</p>
    <Link to="/">Voltar para o login</Link>
  </div>;
}
