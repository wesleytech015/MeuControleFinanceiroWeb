import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

test('account configuration reauthenticates, clears secrets and recovery returns to login', async t => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  const document = dom.window.document;
  const previous = {};
  for (const [key, value] of Object.entries({ window: dom.window, document, HTMLElement: dom.window.HTMLElement,
    localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous[key] = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(async () => root.unmount()); await server.close(); dom.window.close();
    for (const key of Object.keys(previous)) {
      if (previous[key]) Object.defineProperty(globalThis, key, previous[key]); else delete globalThis[key];
    }
  });
  const { default: Form } = await server.ssrLoadModule('/src/components/RecoveryForm.jsx');
  const { default: Settings } = await server.ssrLoadModule('/src/pages/Seguranca.jsx');
  const render = async (component, key) => act(async () => root.render(React.createElement(MemoryRouter, { key, initialEntries: ['/form'] },
    React.createElement(Routes, null,
      React.createElement(Route, { path: '/form', element: component }),
      React.createElement(Route, { path: '/', element: React.createElement('p', { id: 'login' }, 'Login') })))));
  await render(React.createElement(Settings), 'unauthenticated');
  assert.ok(document.getElementById('login'));
  globalThis.localStorage.setItem('token', 'test-token');
  globalThis.localStorage.setItem('usuario', JSON.stringify({ id: 1, nome: 'Alice' }));
  globalThis.localStorage.setItem('financial-data', 'preservar');
  await render(React.createElement(Form, { settings: true }), 'settings');
  const fill = async (name, value) => act(async () => {
    const input = document.getElementById(`recovery-${name}`);
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  const submit = async () => act(async () => {
    document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  });
  let requests = 0;
  let status = 400;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests++;
    const body = JSON.parse(options.body);
    if (options.method === 'PUT') {
      assert.equal(options.headers.Authorization, 'Bearer test-token');
      assert.deepEqual(body, { senhaAtual: 'mF7!x2', palavraChave: 'Meu caderno azul guarda planetas' });
    } else {
      assert.deepEqual(body, { email: 'alice@example.invalid', palavraChave: 'Meu caderno azul guarda planetas', novaSenha: 'nF8!k3' });
    }
    return { ok: status === 200, status, json: async () => status === 200 ? { mensagem: 'Sucesso' } : { erro: 'A senha atual está incorreta.', codigo: 'CURRENT_PASSWORD_INVALID' } };
  });
  await submit(); assert.equal(requests, 0);
  await fill('senhaAtual', 'mF7!x2');
  await fill('palavraChave', 'Meu caderno azul guarda planetas');
  await fill('confirmacaoPalavra', 'different');
  await submit(); assert.equal(requests, 0);
  assert.match(document.getElementById('recovery-confirmacaoPalavra-error').textContent, /não coincidem/);
  await act(async () => document.querySelector('[aria-controls="recovery-palavraChave"]').click());
  assert.equal(document.getElementById('recovery-palavraChave').type, 'text');
  assert.equal(document.getElementById('recovery-confirmacaoPalavra').type, 'password');
  await fill('confirmacaoPalavra', 'Meu caderno azul guarda planetas');
  await submit(); assert.equal(requests, 1);
  assert.match(document.querySelector('[role="alert"]').textContent, /senha atual/);
  status = 200;
  await submit(); assert.equal(requests, 2);
  assert.ok(document.querySelector('[role="status"]'));
  for (const input of document.querySelectorAll('input')) assert.equal(input.value, '');
  assert.equal(globalThis.localStorage.getItem('token'), 'test-token');
  await render(React.createElement(Form), 'recovery');
  await fill('email', 'alice@example.invalid');
  await fill('palavraChave', 'Meu caderno azul guarda planetas');
  await fill('novaSenha', 'nF8!k3');
  await fill('confirmacao', 'nF8!k3');
  await submit(); assert.equal(requests, 3);
  assert.ok(document.getElementById('login'));
  assert.equal(globalThis.localStorage.getItem('token'), null);
  assert.equal(globalThis.localStorage.getItem('financial-data'), 'preservar');
});
