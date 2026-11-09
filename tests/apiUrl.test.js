import assert from "node:assert/strict";
import test from "node:test";
import { resolveApiUrl } from "../src/services/apiUrl.js";

test("uses the local API fallback outside production", () => {
  assert.equal(
    resolveApiUrl(undefined, false),
    "http://localhost:3000/api",
  );
});

test("requires a configured public HTTPS URL in production", () => {
  assert.throws(
    () => resolveApiUrl(undefined, true),
    /VITE_API_URL é obrigatória em produção/,
  );
  assert.throws(
    () => resolveApiUrl("http://api.example.com", true),
    /deve usar HTTPS em produção/,
  );
  assert.throws(
    () => resolveApiUrl("https://localhost:3000", true),
    /host público em produção/,
  );
});

test("normalizes the API prefix to exactly one /api segment", () => {
  assert.equal(
    resolveApiUrl("https://api.example.com/", true),
    "https://api.example.com/api",
  );
  assert.equal(
    resolveApiUrl("https://api.example.com/api/api/", true),
    "https://api.example.com/api",
  );
});

test("rejects malformed or credential-bearing API URLs", () => {
  assert.throws(
    () => resolveApiUrl("not-a-url", false),
    /URL absoluta válida/,
  );
  assert.throws(
    () => resolveApiUrl("https://user:pass@api.example.com", true),
    /não deve conter credenciais/,
  );
});
