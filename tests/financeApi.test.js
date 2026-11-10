import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

const storage = new Map();
const dispatchedEvents = [];

globalThis.localStorage = {
  getItem(key) {
    return storage.get(key) ?? null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  },
  clear() {
    storage.clear();
  },
};

globalThis.window = {
  dispatchEvent(event) {
    dispatchedEvents.push(event);
  },
};

globalThis.CustomEvent = class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
};

const {
  criarTransacao,
  deletarTransacao,
  editarTransacao,
  listarTransacoes,
} = await import("../src/services/api.js");

function jsonResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async json() {
      return body;
    },
  };
}

beforeEach(() => {
  storage.clear();
  storage.set("token", "test-token");
  storage.set("usuario", JSON.stringify({ id: 42 }));
  storage.set("metas", "preservar");
  globalThis.fetch = async () => jsonResponse(200, {});
  dispatchedEvents.length = 0;
});

test("uses authenticated list and CRUD endpoints with the persisted ID", async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    if (options.method === "GET") {
      return jsonResponse(200, { transacoes: [] });
    }
    return jsonResponse(options.method === "POST" ? 201 : 200, { id: 7 });
  };

  await listarTransacoes();
  await criarTransacao({ descricao: "Entrada" });
  await editarTransacao(7, { descricao: "Entrada editada" });
  await deletarTransacao(7);

  assert.deepEqual(
    requests.map(({ url, options }) => [url, options.method]),
    [
      ["http://localhost:3000/api/transacoes", "GET"],
      ["http://localhost:3000/api/transacoes", "POST"],
      ["http://localhost:3000/api/transacoes/7", "PUT"],
      ["http://localhost:3000/api/transacoes/7", "DELETE"],
    ],
  );
  for (const { options } of requests) {
    assert.equal(options.headers.Authorization, "Bearer test-token");
  }
});

test("rejects requests without a token instead of returning empty data", async () => {
  storage.delete("token");
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return jsonResponse(200, { transacoes: [] });
  };

  await assert.rejects(listarTransacoes(), { status: 401 });
  assert.equal(requestCount, 0);
});

test("clears only authentication and emits an event on HTTP 401", async () => {
  globalThis.fetch = async () => jsonResponse(401, { erro: "Token inválido" });

  await assert.rejects(listarTransacoes(), { status: 401 });
  assert.equal(storage.has("token"), false);
  assert.equal(storage.has("usuario"), false);
  assert.equal(storage.get("metas"), "preservar");
  assert.equal(dispatchedEvents[0].type, "auth-change");
});

test("surfaces API validation and not-found errors with their status", async () => {
  globalThis.fetch = async () => jsonResponse(404, { erro: "Não encontrada" });

  await assert.rejects(
    editarTransacao(12, {}),
    (error) => error.status === 404 && error.message === "Não encontrada",
  );
});

test("does not turn a network failure into an empty successful result", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };

  await assert.rejects(listarTransacoes(), /fetch failed/);
});
