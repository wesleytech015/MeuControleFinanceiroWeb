import { Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import RecoveryForm from '../components/RecoveryForm';
import { readAuthSession } from '../services/authSession.js';

export default function Seguranca() {
  if (!readAuthSession()) return <Navigate to="/" replace />;
  return <Layout><div className="recovery-settings"><RecoveryForm settings /></div></Layout>;
}
