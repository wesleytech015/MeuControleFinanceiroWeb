export function validateLogin(email, senha) {
  const normalizedEmail = email.trim();
  if (!normalizedEmail && !senha) return "Informe seu e-mail e senha para continuar.";
  if (!normalizedEmail) return "Informe seu e-mail.";
  if (!senha) return "Informe sua senha.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return "Informe um e-mail válido.";
  return "";
}
