import { useState } from 'react';

export default function RecoveryInput({ name, label, value, onChange, error, disabled, secret = true, autoComplete = 'off' }) {
  const [visible, setVisible] = useState(false);
  const id = `recovery-${name}`;
  return <div className="cadastro-field">
    <label htmlFor={id}>{label}</label>
    <div className={secret ? 'cadastro-password-field' : 'cadastro-input-field'}>
      <input id={id} name={name} type={secret ? (visible ? 'text' : 'password') : 'email'} value={value}
        autoComplete={autoComplete} required disabled={disabled} onChange={event => onChange(name, event.target.value)}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
      {secret && <button type="button" className="cadastro-password-toggle" aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
        aria-controls={id} aria-pressed={visible} onClick={() => setVisible(previous => !previous)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{visible && <path d="m3 3 18 18" />}</svg>
      </button>}
    </div>
    {error && <p id={`${id}-error`} className="cadastro-field-error" role="alert">{error}</p>}
  </div>;
}
