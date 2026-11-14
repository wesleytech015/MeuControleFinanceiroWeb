import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeDate,
  normalizeMoney,
  normalizeTransacao,
  normalizeTransacoesResponse,
  toApiTransacao,
} from "../src/services/financeData.js";

test("normalizes browser and PostgreSQL money formats to cents", () => {
  assert.equal(normalizeMoney("R$ 1.234,56"), 1234.56);
  assert.equal(normalizeMoney("1234.56"), 1234.56);
  assert.equal(normalizeMoney(1.005), 1.01);
});

test("normalizes dates without shifting the calendar date by timezone", () => {
  assert.equal(normalizeDate("09/11/2026"), "2026-11-09");
  assert.equal(
    normalizeDate("2026-11-09T00:00:00.000Z"),
    "2026-11-09",
  );
  assert.throws(() => normalizeDate("31/02/2026"), /data de calendário válida/);
});

test("converts API records into the format consumed by existing screens", () => {
  assert.deepEqual(
    normalizeTransacao({
      id: 17,
      tipo: "despesa",
      descricao: "Mercado",
      valor: "1234.56",
      data: "2026-11-09",
      categoria: "Alimentação",
      forma_pagamento: "Pix",
      usuario_id: 999,
    }),
    {
      id: 17,
      tipo: "Despesa",
      descricao: "Mercado",
      valor: 1234.56,
      data: "09/11/2026",
      categoria: "Alimentação",
      forma_pagamento: "Pix",
    },
  );
  assert.throws(
    () => normalizeTransacoesResponse({ transacoes: null }),
    /não contém a lista/,
  );
});

test("builds a whitelisted API payload with lowercase type and ISO date", () => {
  assert.deepEqual(
    toApiTransacao({
      id: 17,
      usuario_id: 999,
      tipo: "Receita",
      descricao: "Salário",
      valor: "R$ 2.000,01",
      data: "09/11/2026",
      categoria: "Trabalho",
      forma_pagamento: "Pix",
      cartao_id: 3,
      parcelas: 12,
    }),
    {
      descricao: "Salário",
      valor: 2000.01,
      tipo: "receita",
      data: "2026-11-09",
      categoria: "Trabalho",
      forma_pagamento: "Pix",
    },
  );
});
