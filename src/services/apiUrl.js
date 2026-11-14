const DEVELOPMENT_API_URL = "http://localhost:3000/api";

export function resolveApiUrl(value, isProduction) {
  const configuredUrl = value?.trim();

  if (!configuredUrl) {
    if (isProduction) {
      throw new Error(
        "VITE_API_URL é obrigatória em produção. Configure a URL HTTPS pública da API.",
      );
    }

    return DEVELOPMENT_API_URL;
  }

  let apiUrl;
  try {
    apiUrl = new URL(configuredUrl);
  } catch {
    throw new Error("VITE_API_URL deve ser uma URL absoluta válida.");
  }

  if (!["http:", "https:"].includes(apiUrl.protocol)) {
    throw new Error("VITE_API_URL deve usar o protocolo HTTP ou HTTPS.");
  }

  if (isProduction && apiUrl.protocol !== "https:") {
    throw new Error("VITE_API_URL deve usar HTTPS em produção.");
  }

  if (
    isProduction &&
    (apiUrl.hostname === "localhost" ||
      apiUrl.hostname.endsWith(".localhost") ||
      apiUrl.hostname === "127.0.0.1" ||
      apiUrl.hostname === "[::1]" ||
      apiUrl.hostname === "0.0.0.0")
  ) {
    throw new Error("VITE_API_URL deve apontar para um host público em produção.");
  }

  if (apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
    throw new Error(
      "VITE_API_URL não deve conter credenciais, query string ou fragmento.",
    );
  }

  const basePath = apiUrl.pathname.replace(/\/+$/, "").replace(/(?:\/api)+$/i, "");
  apiUrl.pathname = `${basePath}/api`;

  return apiUrl.toString().replace(/\/$/, "");
}
