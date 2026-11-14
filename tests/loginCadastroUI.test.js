import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { createServer } from 'vite';

test('login recovery only announces availability; signup navigation and password limits remain intact', async t => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  const document = dom.window.document;
  const previous = {};
  for (const [key, value] of Object.entries({ window: dom.window, document,
    HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous[key] = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(async () => root.unmount());
    await server.close(); dom.window.close();
    for (const key of Object.keys(previous)) {
      if (previous[key]) Object.defineProperty(globalThis, key, previous[key]); else delete globalThis[key];
    }
  });
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    requests++;
    throw new Error('Informational action and navigation must never call an API');
  });
  const { default: Login } = await server.ssrLoadModule('/src/pages/Login.jsx');
  const { default: Cadastro } = await server.ssrLoadModule('/src/pages/Cadastro.jsx');
  function Location() {
    return React.createElement('output', { id: 'current-route' }, useLocation().pathname);
  }
  await act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: ['/'] },
    React.createElement(Location),
    React.createElement(Routes, null,
      React.createElement(Route, { path: '/', element: React.createElement(Login) }),
      React.createElement(Route, { path: '/cadastro', element: React.createElement(Cadastro) }),
      React.createElement(Route, { path: '/recuperar-senha', element: React.createElement('p', { id: 'unexpected-recovery' }, 'Unexpected') })))));
  const fill = async (id, value) => act(async () => {
    const input = document.getElementById(id);
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  const trigger = Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Esqueceu sua senha? Recuperar acesso');
  assert.ok(trigger);
  assert.equal(trigger.type, 'button');
  assert.equal(document.querySelector('a[href="/recuperar-senha"]'), null);
  const status = document.querySelector('[role="status"]');
  assert.equal(status.getAttribute('aria-live'), 'polite');
  assert.equal(status.textContent, '');
  let submissions = 0;
  document.querySelector('form').addEventListener('submit', () => submissions++);
  await fill('login-email', 'alice@example.invalid');
  await fill('login-password', 'mF7!x2');
  trigger.focus();
  assert.equal(document.activeElement, trigger);
  await act(async () => trigger.click());
  assert.equal(status.textContent, 'A recuperação de senha ainda não está disponível. Estamos trabalhando para disponibilizar essa funcionalidade em breve.');
  await act(async () => trigger.click());
  assert.equal(document.querySelectorAll('.login-info').length, 1);
  assert.equal(document.getElementById('current-route').textContent, '/');
  assert.equal(document.getElementById('login-email').value, 'alice@example.invalid');
  assert.equal(document.getElementById('login-password').value, 'mF7!x2');
  assert.equal(submissions, 0);
  assert.equal(requests, 0);
  await act(async () => document.querySelector('a[href="/cadastro"]').click());
  assert.equal(document.getElementById('current-route').textContent, '/cadastro');
  assert.equal(document.getElementById('cadastro-senha-hint').textContent, 'Crie uma senha com pelo menos 6 caracteres para proteger sua conta.');
  assert.ok(document.getElementById('cadastro-senha').getAttribute('aria-describedby').includes('cadastro-senha-hint'));
  assert.equal(document.querySelector('.cadastro-footer'), null);
  const back = document.querySelector('.cadastro-back-link');
  assert.equal(back.textContent, 'Voltar para o login');
  assert.equal(back.querySelector('svg').getAttribute('aria-hidden'), 'true');
  assert.equal(back.closest('form'), null);
  assert.equal(back.previousElementSibling.tagName, 'FORM');
  assert.equal(document.querySelectorAll('a[href="/"]').length, 1);
  assert.equal(back.getAttribute('href'), '/');
  await fill('cadastro-nome', 'Alice');
  await fill('cadastro-email', 'alice@example.invalid');
  await fill('cadastro-senha', 'á'.repeat(37));
  await fill('cadastro-confirmacao', 'á'.repeat(37));
  await act(async () => document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
  assert.equal(document.getElementById('cadastro-senha-error').textContent, 'A senha excede o tamanho máximo permitido.');
  assert.equal(requests, 0);
  await act(async () => back.click());
  assert.equal(document.getElementById('current-route').textContent, '/');
  assert.ok(document.getElementById('login-password'));
  assert.equal(document.getElementById('unexpected-recovery'), null);
  assert.equal(requests, 0);
});
