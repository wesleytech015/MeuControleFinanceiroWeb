import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createServer } from "vite";

test("legal pages are public routes with direct Vercel rewrites", async t => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/privacidade" });
  const previous = {};
  for (const [key, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    previous[key] = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }

  const server = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    appType: "custom",
  });
  const { createRoot } = await import("react-dom/client");
  const { default: App } = await server.ssrLoadModule("/src/App.jsx");
  const root = createRoot(dom.window.document.getElementById("root"));

  t.after(async () => {
    await act(async () => root.unmount());
    await server.close();
    dom.window.close();
    for (const key of Object.keys(previous)) {
      if (previous[key]) Object.defineProperty(globalThis, key, previous[key]);
      else delete globalThis[key];
    }
  });

  await act(async () => root.render(React.createElement(App)));
  const pages = [
    ["/privacidade", "Política de Privacidade"],
    ["/termos", "Termos de Serviço"],
    ["/exclusao-de-dados", "Exclusão de Dados"],
  ];

  for (const [path, title] of pages) {
    await act(async () => {
      dom.window.history.pushState({}, "", path);
      dom.window.dispatchEvent(new dom.window.PopStateEvent("popstate"));
    });
    assert.equal(dom.window.document.querySelector(".legal-page h1")?.textContent, title);
    assert.equal(dom.window.document.querySelector('a[href^="mailto:"]')?.getAttribute("href").includes("eliezercosta.ti@gmail.com"), true);
  }

  const vercel = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const rewrites = vercel.rewrites.map(rewrite => rewrite.source);
  for (const [path] of pages) assert.ok(rewrites.includes(path), `Missing Vercel rewrite for ${path}`);
});
