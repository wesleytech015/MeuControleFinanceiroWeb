import assert from "node:assert/strict";
import test from "node:test";
import { clearAuthSession, readAuthSession } from "../src/services/authSession.js";

const values = new Map();
const events = [];
globalThis.localStorage = {
  getItem(key) {
    return values.get(key) ?? null;
  },
  setItem(key, value) {
    values.set(key, String(value));
  },
  removeItem(key) {
    values.delete(key);
  },
};
globalThis.window = {
  dispatchEvent(event) {
    events.push(event);
  },
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
};

test("requires a token and user ID and distinguishes account sessions", () => {
  values.clear();
  assert.equal(readAuthSession(), null);

  values.set("token", "token-a");
  values.set("usuario", JSON.stringify({ id: 1 }));
  const firstSession = readAuthSession();
  assert.equal(firstSession.key, "1:token-a");

  values.set("usuario", JSON.stringify({ id: 2 }));
  assert.notEqual(readAuthSession().key, firstSession.key);
});

test("logout clears authentication and preserves unrelated local data", () => {
  values.clear();
  values.set("token", "token-a");
  values.set("usuario", JSON.stringify({ id: 1 }));
  values.set("cartoes", "dados locais");

  clearAuthSession();

  assert.equal(readAuthSession(), null);
  assert.equal(values.get("cartoes"), "dados locais");
  assert.equal(events.at(-1).type, "auth-change");
});
