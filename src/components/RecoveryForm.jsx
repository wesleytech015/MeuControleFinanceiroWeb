import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RecoveryInput from './RecoveryInput';
import { validateCadastro } from '../services/cadastroValidation.js';
import { validateRecoveryFields } from '../services/recoveryValidation.js';
import { configurarPalavraChave, redefinirPorPalavraChave } from '../services/recoveryApi.js';
import { clearAuthSession, readAuthSession } from '../services/authSession.js';
import '../styles/cadastro.css';
import '../styles/recovery.css';

export default function RecoveryForm({ settings = false }) {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const pending = useRef(false);
  const [values, setValues] = useState({ email: '', senhaAtual: '', palavraChave: '', confirmacaoPalavra: '', novaSenha: '', confirmacao: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  function change(name, value) {
    setValues(previous => ({ ...previous, [name]: value }));
    setErrors({}); setMessage(''); setSuccess(false);
  }
  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const usuario = settings ? readAuthSession()?.usuario : null;
    const validation = settings ? validateRecoveryFields({ ...values, senha: values.senhaAtual, nome: usuario?.nome || '', email: usuario?.email || '' }) : {};
    if (settings && !values.senhaAtual) validation.senhaAtual = 'Informe sua senha atual.';
    if (!settings) {
      const passwordErrors = validateCadastro({ nome: 'Recuperação', email: values.email, senha: values.novaSenha, confirmacao: values.confirmacao });
      if (passwordErrors.email) validation.email = passwordErrors.email;
      if (passwordErrors.senha) validation.novaSenha = passwordErrors.senha;
      if (passwordErrors.confirmacao) validation.confirmacao = passwordErrors.confirmacao;
      if (!values.palavraChave) validation.palavraChave = 'Informe sua palavra-chave de recuperação.';
      if (values.novaSenha && values.novaSenha === values.palavraChave) validation.novaSenha = 'Escolha uma senha diferente da palavra-chave de recuperação.';
    }
    setErrors(validation); setMessage('');
    if (Object.keys(validation).length) {
      formRef.current.elements.namedItem(Object.keys(validation)[0])?.focus();
      return;
    }
    pending.current = true; setLoading(true);
    try {
      if (settings) {
        const session = readAuthSession();
        await configurarPalavraChave(values.senhaAtual, values.palavraChave, session?.token);
        setValues({ email: '', senhaAtual: '', palavraChave: '', confirmacaoPalavra: '', novaSenha: '', confirmacao: '' });
        setSuccess(true); setMessage('Palavra-chave de recuperação atualizada. Guarde sua frase em local seguro.');
      } else {
        await redefinirPorPalavraChave(values.email.trim(), values.palavraChave, values.novaSenha);
        clearAuthSession();
        setValues({ email: '', senhaAtual: '', palavraChave: '', confirmacaoPalavra: '', novaSenha: '', confirmacao: '' });
        navigate('/', { replace: true, state: { recoverySuccess: true } });
      }
    } catch (error) {
      if (settings && error.status === 401) { clearAuthSession(); navigate('/', { replace: true }); }
      else setMessage(error.message);
    } finally { pending.current = false; setLoading(false); }
  }
  const input = (name, label, extra = {}) => <RecoveryInput key={name} name={name} label={label} value={values[name]} onChange={change} error={errors[name]} disabled={loading} {...extra} />;
  return <div className="cadastro-card recovery-card">
    <h1>{settings ? 'Segurança da conta' : 'Recuperar senha'}</h1>
    <p>{settings ? 'Cadastre ou substitua sua frase secreta. A frase anterior nunca é exibida.' : 'Informe o e-mail e a frase secreta cadastrados para definir uma nova senha.'}</p>
    {message && <p role={success ? 'status' : 'alert'} className={success ? 'recovery-success' : 'erro-cadastro'}>{message}</p>}
    <form ref={formRef} onSubmit={submit} noValidate aria-busy={loading}>
      {settings ? input('senhaAtual', 'Senha atual', { autoComplete: 'current-password' }) : input('email', 'E-mail', { secret: false, autoComplete: 'email' })}
      {input('palavraChave', settings ? 'Nova palavra-chave de recuperação' : 'Palavra-chave de recuperação')}
      {settings && <p className="cadastro-hint">Use uma frase única de 12 a 256 caracteres, diferente da senha e de informações pessoais.</p>}
      {settings ? input('confirmacaoPalavra', 'Confirmar palavra-chave') : <>
        {input('novaSenha', 'Nova senha', { autoComplete: 'new-password' })}
        {input('confirmacao', 'Confirmar nova senha', { autoComplete: 'new-password' })}
      </>}
      <button type="submit" disabled={loading}>{loading ? 'Salvando...' : settings ? 'Salvar palavra-chave' : 'Redefinir senha'}</button>
    </form>
    <p className="cadastro-footer">{settings ? 'A palavra-chave permite redefinir sua senha. Não a compartilhe.' : <Link to="/">Voltar para o login</Link>}</p>
  </div>;
}
