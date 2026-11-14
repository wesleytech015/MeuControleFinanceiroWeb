import RecoveryForm from '../components/RecoveryForm';
import { Link } from 'react-router-dom';
export default function RecuperarSenha() {
  if (import.meta.env.PROD) return <div className="cadastro-page"><div className="cadastro-card"><h1>Recuperação indisponível</h1><p>A recuperação de senha não está disponível neste ambiente.</p><Link to="/">Voltar para o login</Link></div></div>;
  return <div className="cadastro-page"><RecoveryForm /></div>;
}
