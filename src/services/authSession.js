export function readAuthSession() {
  const token = localStorage.getItem("token");
  const usuarioSalvo = localStorage.getItem("usuario");

  if (!token || !usuarioSalvo) return null;

  let usuario;
  try {
    usuario = JSON.parse(usuarioSalvo);
  } catch {
    return null;
  }

  if (usuario?.id == null) return null;

  return {
    token,
    usuario,
    key: `${usuario.id}:${token}`,
  };
}

export function notifyAuthChange(detail) {
  window.dispatchEvent(new CustomEvent("auth-change", { detail }));
}

export function clearAuthSession(detail) {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  notifyAuthChange(detail);
}
