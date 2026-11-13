import { normalizeDate } from "../services/financeData.js";

export function monthlyMovements(movimentacoes) {
  const months = new Map();
  for (const item of movimentacoes) {
    if (item.tipo !== "Receita" && item.tipo !== "Despesa") continue;
    let date;
    try { date = normalizeDate(item.data); } catch { continue; }
    const key = date.slice(0, 7);
    if (!months.has(key)) months.set(key, { month: key, receitas: 0, despesas: 0 });
    months.get(key)[item.tipo === "Receita" ? "receitas" : "despesas"] += Number(item.valor || 0);
  }
  return [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
}
