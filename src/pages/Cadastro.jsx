import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cadastrar } from "../services/api";
import { cadastroError, cadastroErrorField, validateCadastro } from "../services/cadastroValidation.js";
import "../styles/cadastro.css";

function Cadastro() {
  const navigate = useNavigate();
  const pending = useRef(false);
  const formRef = useRef(null);
  const [values, setValues] = useState({ nome: "", email: "", senha: "", confirmacao: "" });
  const [errors, setErrors] = useState({});
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [visible, setVisible] = useState({ senha: false, confirmacao: false });

  function change(field, value) {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined, ...(field === "senha" ? { confirmacao: undefined } : {}) }));
    setErro("");
  }

  async function handleCadastro(event) {
    event.preventDefault();
    if (pending.current) return;
    const validation = validateCadastro(values);
    setErrors(validation);
    setErro("");
    const firstInvalid = Object.keys(validation)[0];
    if (firstInvalid) {
      formRef.current.elements.namedItem(firstInvalid)?.focus();
      return;
    }

    pending.current = true;
    setCarregando(true);
    try {
      // A confirmação é local; o contrato compartilhado com o Mobile é preservado.
      await cadastrar(values.nome.trim(), values.email.trim(), values.senha);
      alert("Conta criada com sucesso!");
      navigate("/");
    } catch (error) {
      const field = cadastroErrorField(error);
      if (field) setErrors({ [field]: cadastroError(error) });
      else setErro(cadastroError(error));
    } finally {
      pending.current = false;
      setCarregando(false);
    }
  }

  const fields = [
    { name: "nome", label: "Nome", type: "text", placeholder: "Digite seu nome", autoComplete: "name" },
    { name: "email", label: "E-mail", type: "email", placeholder: "seu@email.com", autoComplete: "email" },
    { name: "senha", label: "Senha", type: "password", placeholder: "Digite sua senha", autoComplete: "new-password" },
    { name: "confirmacao", label: "Confirmar senha", type: "password", placeholder: "Digite sua senha novamente", autoComplete: "new-password" },
  ];

  return (
    <div className="cadastro-page">
      <div className="cadastro-card">
        <h1>Criar conta</h1>
        <p>Cadastre-se para controlar suas finanças.</p>
        {erro && <p className="erro-cadastro" role="alert">{erro}</p>}
        <form ref={formRef} onSubmit={handleCadastro} noValidate aria-busy={carregando}>
          {fields.map(field => (
            <div className="cadastro-field" key={field.name}>
              <label htmlFor={`cadastro-${field.name}`}>{field.label}</label>
              <div className={field.type === "password" ? "cadastro-password-field" : "cadastro-input-field"}>
              <input
                id={`cadastro-${field.name}`}
                name={field.name}
                type={field.type === "password" && visible[field.name] ? "text" : field.type}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                value={values[field.name]}
                required
                disabled={carregando}
                aria-invalid={Boolean(errors[field.name])}
                aria-describedby={[
                  field.name === "senha" ? "cadastro-senha-hint" : "",
                  errors[field.name] ? `cadastro-${field.name}-error` : "",
                ].filter(Boolean).join(" ") || undefined}
                onChange={event => change(field.name, event.target.value)}
              />
              {field.type === "password" && (
                <button
                  type="button"
                  className="cadastro-password-toggle"
                  aria-label={`${visible[field.name] ? "Ocultar" : "Mostrar"} ${field.name === "senha" ? "senha" : "confirmação de senha"}`}
                  aria-pressed={visible[field.name]}
                  aria-controls={`cadastro-${field.name}`}
                  onClick={() => setVisible(previous => ({ ...previous, [field.name]: !previous[field.name] }))}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{visible[field.name] && <path d="m3 3 18 18" />}</svg>
                </button>
              )}
              </div>
              {field.name === "senha" && <p id="cadastro-senha-hint" className="cadastro-hint">Mínimo de 6 caracteres e máximo de 72 bytes UTF-8.</p>}
              {errors[field.name] && <p id={`cadastro-${field.name}-error`} className="cadastro-field-error" role="alert">{errors[field.name]}</p>}
            </div>
          ))}
          <button type="submit" disabled={carregando}>{carregando ? "Cadastrando..." : "Cadastrar"}</button>
        </form>
        <p className="cadastro-footer">Já tem conta? <Link to="/">Entrar</Link></p>
      </div>
    </div>
  );
}

export default Cadastro;
