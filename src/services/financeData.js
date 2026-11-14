const TYPE_LABELS = {
  receita: "Receita",
  despesa: "Despesa",
};

function roundToCents(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function normalizeMoney(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? roundToCents(value) : NaN;
  }

  const text = String(value ?? "")
    .replace(/[^\d,.-]/g, "")
    .trim();

  if (!text) return NaN;

  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
  const amount = Number(normalized);

  return Number.isFinite(amount) ? roundToCents(amount) : NaN;
}

export function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const text = String(value ?? "").trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const isoDate = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    if (!isValidIsoDate(isoDate)) {
      throw new Error("Data inválida. Use uma data de calendário válida.");
    }
    return isoDate;
  }

  const brazilianMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brazilianMatch) {
    const isoDate = `${brazilianMatch[3]}-${brazilianMatch[2]}-${brazilianMatch[1]}`;
    if (!isValidIsoDate(isoDate)) {
      throw new Error("Data inválida. Use uma data de calendário válida.");
    }
    return isoDate;
  }

  throw new Error("Data inválida. Use o formato DD/MM/AAAA ou AAAA-MM-DD.");
}

function isValidIsoDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function formatDateForScreens(value) {
  const isoDate = normalizeDate(value);
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function normalizeTransacao(transacao) {
  if (!transacao || transacao.id == null) {
    throw new Error("A API retornou uma movimentação sem ID persistido.");
  }

  const tipo = String(transacao.tipo ?? "").toLowerCase();
  if (!TYPE_LABELS[tipo]) {
    throw new Error("A API retornou uma movimentação com tipo inválido.");
  }

  const valor = normalizeMoney(transacao.valor);
  if (!Number.isFinite(valor)) {
    throw new Error("A API retornou uma movimentação com valor inválido.");
  }

  return {
    id: transacao.id,
    tipo: TYPE_LABELS[tipo],
    descricao: transacao.descricao ?? "",
    valor,
    data: formatDateForScreens(transacao.data),
    categoria: transacao.categoria ?? "",
    forma_pagamento: transacao.forma_pagamento ?? "",
  };
}

export function normalizeTransacoesResponse(response) {
  if (!Array.isArray(response?.transacoes)) {
    throw new Error("A resposta da API não contém a lista de movimentações.");
  }

  return response.transacoes.map(normalizeTransacao);
}

export function toApiTransacao(transacao) {
  const tipo = String(transacao.tipo ?? "").toLowerCase();
  if (!TYPE_LABELS[tipo]) {
    throw new Error("Tipo inválido. Use Receita ou Despesa.");
  }

  const valor = normalizeMoney(transacao.valor);
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error("O valor deve ser maior que zero.");
  }

  const descricao = String(transacao.descricao ?? "").trim();
  if (!descricao) {
    throw new Error("A descrição é obrigatória.");
  }

  return {
    descricao,
    valor,
    tipo,
    data: normalizeDate(transacao.data),
    categoria: transacao.categoria || null,
    forma_pagamento: transacao.forma_pagamento || null,
  };
}
