import RecoveryForm from '../components/RecoveryForm';
import RecoveryUnavailable from '../components/RecoveryUnavailable';
import { isRecoveryFeatureEnabled } from '../config/recoveryFeature.js';
export default function RecuperarSenha() {
  if (!isRecoveryFeatureEnabled()) return <div className="cadastro-page"><RecoveryUnavailable /></div>;
  return <div className="cadastro-page"><RecoveryForm /></div>;
}
