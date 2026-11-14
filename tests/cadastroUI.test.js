import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

test('password toggles are independent, accessible, and never submit the signup form', async (t) => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/cadastro' });
  const document = dom.window.document;
  const previous = {};
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document,
    HTMLElement: dom.window.HTMLElement, alert: () => {}, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous[key] = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom' });
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(async () => root.unmount());
    await server.close();
    dom.window.close();
    for (const key of Object.keys(previous)) {
      if (previous[key]) Object.defineProperty(globalThis, key, previous[key]);
      else delete globalThis[key];
    }
  });
  const { default: Cadastro } = await server.ssrLoadModule('/src/pages/Cadastro.jsx');
  await act(async () => root.render(React.createElement(MemoryRouter, null, React.createElement(Cadastro))));
  const password = document.getElementById('cadastro-senha');
  const confirmation = document.getElementById('cadastro-confirmacao');
  const toggle = document.querySelector('[aria-controls="cadastro-senha"]');
  const confirmToggle = document.querySelector('[aria-controls="cadastro-confirmacao"]');
  let submissions = 0;
  document.querySelector('form').addEventListener('submit', () => submissions++);
  assert.equal(password.type, 'password');
  assert.equal(confirmation.type, 'password');
  for (const button of [toggle, confirmToggle]) {
    assert.equal(button.type, 'button');
    button.focus();
    assert.equal(document.activeElement, button);
  }
  assert.equal(toggle.getAttribute('aria-label'), 'Mostrar senha');
  assert.equal(confirmToggle.getAttribute('aria-label'), 'Mostrar confirmação de senha');
  await act(async () => toggle.click());
  assert.equal(password.type, 'text');
  assert.equal(confirmation.type, 'password');
  assert.equal(toggle.getAttribute('aria-pressed'), 'true');
  assert.equal(toggle.getAttribute('aria-label'), 'Ocultar senha');
  await act(async () => confirmToggle.click());
  assert.equal(confirmation.type, 'text');
  assert.equal(password.type, 'text');
  assert.equal(confirmToggle.getAttribute('aria-label'), 'Ocultar confirmação de senha');
  await act(async () => toggle.click());
  assert.equal(password.type, 'password');
  assert.equal(confirmation.type, 'text');
  await act(async () => confirmToggle.click());
  assert.equal(confirmation.type, 'password');
  assert.equal(confirmToggle.getAttribute('aria-pressed'), 'false');
  assert.equal(submissions, 0);

  let requests = 0;
  let responseStatus = 409;
  let success = false;
  t.mock.method(globalThis, 'alert', () => { success = true; });
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests++;
    assert.ok(url.endsWith('/usuarios'));
    assert.deepEqual(JSON.parse(options.body), { nome: 'Maria', email: 'maria@example.com', senha: 'mF7!x2' });
    return { ok: responseStatus === 201, status: responseStatus,
      json: async () => responseStatus === 201 ? { id: 42, mensagem: 'Sucesso' } : { erro: 'Este e-mail já está cadastrado.', codigo: 'EMAIL_EXISTS' } };
  });
  const submit = async () => act(async () => {
    document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  });
  const fill = async (name, value) => act(async () => {
    const input = document.getElementById(`cadastro-${name}`);
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  await submit();
  assert.equal(requests, 0);
  assert.equal(document.activeElement.id, 'cadastro-nome');
  await fill('nome', 'Maria');
  await fill('email', 'maria@example.com');
  await fill('senha', '123456');
  await fill('confirmacao', '123456');
  await submit();
  assert.equal(requests, 0);
  assert.equal(document.getElementById('cadastro-senha-error').textContent, 'Escolha uma senha mais segura. Evite sequências como 123456.');
  await fill('senha', 'mF7!x2');
  await fill('confirmacao', 'mF7!x2');
  await submit();
  assert.equal(requests, 1);
  assert.equal(document.getElementById('cadastro-email-error').textContent, 'Este e-mail já está cadastrado.');
  responseStatus = 201;
  await submit();
  assert.equal(requests, 2);
  assert.equal(success, true);
  assert.equal(document.querySelector('button[type="submit"]').disabled, false);
});
