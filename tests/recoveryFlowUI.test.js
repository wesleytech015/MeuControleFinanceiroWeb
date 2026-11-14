import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

test('recovery frontend integration with simulated API', async t => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  const document = dom.window.document;
  const previous = {};
  for (const [key, value] of Object.entries({ window: dom.window, document, HTMLElement: dom.window.HTMLElement,
    localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous[key] = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const servers = [];
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(async () => root.unmount());
    for (const server of servers) await server.close();
    dom.window.close();
    for (const key of Object.keys(previous)) {
      if (previous[key]) Object.defineProperty(globalThis, key, previous[key]); else delete globalThis[key];
    }
  });
  async function modules(enabled, production) {
    const server = await createServer({
      define: { 'import.meta.env.VITE_RECOVERY_ENABLED': JSON.stringify(enabled), 'import.meta.env.PROD': JSON.stringify(production),
        'import.meta.env.VITE_API_URL': JSON.stringify('https://api.example.invalid/api') },
      server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom',
    });
    servers.push(server);
    return {
      Login: (await server.ssrLoadModule('/src/pages/Login.jsx')).default,
      Recovery: (await server.ssrLoadModule('/src/pages/RecuperarSenha.jsx')).default,
      Form: (await server.ssrLoadModule('/src/components/RecoveryForm.jsx')).default,
    };
  }
  const enabled = await modules('true', false);
  let renderId = 0;
  function CurrentRoute() { return React.createElement('output', { id: 'route' }, useLocation().pathname); }
  async function render(path = '/recuperar-senha', components = enabled, directForm = false) {
    await act(async () => root.render(React.createElement(MemoryRouter, { key: ++renderId, initialEntries: [path] },
      React.createElement(CurrentRoute), React.createElement(Routes, null,
        React.createElement(Route, { path: '/', element: React.createElement(components.Login) }),
        React.createElement(Route, { path: '/recuperar-senha', element: React.createElement(directForm ? components.Form : components.Recovery) })))));
  }
  const phrase = '  Meu caderno azul guarda planetas  ';
  const valid = { email: 'alice@example.invalid', palavraChave: phrase, novaSenha: 'nF8!k3', confirmacao: 'nF8!k3' };
  async function fill(values) {
    for (const [name, value] of Object.entries(values)) await act(async () => {
      const input = document.getElementById(`recovery-${name}`);
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, value);
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
  }
  const dispatchSubmit = () => document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  const submit = async () => act(async () => { dispatchSubmit(); });
  const calls = [];
  let respond;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return respond();
  });
  function reset() {
    calls.length = 0;
    globalThis.localStorage.clear();
    respond = async () => { throw new Error('Unexpected API request'); };
  }
  const response = (status, body) => ({ ok: status === 200, status, json: async () => body });

  await t.test('enabled Login opens recovery and back link returns without an API call', async () => {
    reset(); await render('/');
    const triggers = document.querySelectorAll('.login-recovery-notice-trigger');
    assert.equal(triggers.length, 1);
    assert.equal(triggers[0].type, 'button');
    assert.ok(triggers[0].closest('form'));
    assert.equal(triggers[0].previousElementSibling.className, 'login-password-field');
    let submissions = 0;
    document.querySelector('form').addEventListener('submit', () => submissions++);
    await act(async () => triggers[0].click());
    assert.equal(submissions, 0);
    assert.equal(document.getElementById('route').textContent, '/recuperar-senha');
    for (const name of Object.keys(valid)) assert.ok(document.getElementById(`recovery-${name}`));
    assert.equal(document.getElementById('recovery-palavraChave').type, 'password');
    await act(async () => document.querySelector('a[href="/"]').click());
    assert.equal(document.getElementById('route').textContent, '/');
    assert.equal(calls.length, 0);
  });
  await t.test('valid submission sends exactly three fields, preserves phrase, clears only session and shows success', async () => {
    reset(); await render();
    globalThis.localStorage.setItem('token', 'old-token');
    globalThis.localStorage.setItem('usuario', JSON.stringify({ id: 1 }));
    globalThis.localStorage.setItem('finances', 'preserve');
    respond = async () => response(200, { mensagem: 'Senha redefinida.' });
    await fill(valid); await submit();
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.endsWith('/api/recuperacao-senha'));
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(calls[0].options.body), { email: valid.email, palavraChave: phrase, novaSenha: valid.novaSenha });
    assert.equal(document.getElementById('route').textContent, '/');
    assert.ok(document.body.textContent.includes('Senha redefinida. Entre com sua nova senha.'));
    assert.equal(globalThis.localStorage.getItem('token'), null);
    assert.equal(globalThis.localStorage.getItem('usuario'), null);
    assert.equal(globalThis.localStorage.getItem('finances'), 'preserve');
    assert.equal(globalThis.localStorage.getItem('palavraChave'), null);
  });
  for (const [label, changes, field] of [
    ['invalid email', { email: 'invalid' }, 'email'],
    ['missing phrase', { palavraChave: '' }, 'palavraChave'],
    ['oversized Unicode phrase', { palavraChave: '🌌'.repeat(257) }, 'palavraChave'],
    ['short password', { novaSenha: 'a', confirmacao: 'a' }, 'novaSenha'],
    ['oversized password', { novaSenha: 'á'.repeat(37), confirmacao: 'á'.repeat(37) }, 'novaSenha'],
    ['common password', { novaSenha: '123456', confirmacao: '123456' }, 'novaSenha'],
    ['missing confirmation', { confirmacao: '' }, 'confirmacao'],
    ['different passwords', { confirmacao: 'different' }, 'confirmacao'],
    ['password equals phrase', { novaSenha: phrase, confirmacao: phrase }, 'novaSenha'],
  ]) await t.test(`${label} is rejected locally without API`, async () => {
    reset(); await render(); await fill({ ...valid, ...changes }); await submit();
    assert.equal(calls.length, 0);
    assert.ok(document.getElementById(`recovery-${field}-error`));
    assert.equal(document.activeElement.id, `recovery-${field}`);
  });
  await t.test('wrong phrase and nonexistent email show identical generic errors without logging credentials', async child => {
    const logs = [];
    for (const method of ['log', 'warn', 'error', 'info']) child.mock.method(globalThis.console, method, (...args) => logs.push(args.join(' ')));
    const messages = [];
    for (const body of [{ erro: `Palavra-chave incorreta: ${phrase}`, codigo: 'RECOVERY_INVALID' },
      { erro: `E-mail inexistente; credencial ${phrase}`, codigo: 'EMAIL_NOT_FOUND' }]) {
      reset(); await render(); await fill(valid);
      globalThis.localStorage.setItem('token', 'preserve-session-on-failure');
      respond = async () => response(400, body);
      await submit();
      const message = document.querySelector('[role="alert"]').textContent;
      messages.push(message);
      assert.equal(message.includes(phrase), false);
      assert.equal(calls.length, 1);
      assert.equal(document.getElementById('route').textContent, '/recuperar-senha');
      assert.equal(globalThis.localStorage.getItem('token'), 'preserve-session-on-failure');
    }
    assert.equal(messages[0], messages[1]);
    assert.ok(logs.every(line => !line.includes(phrase)));
  });
  await t.test('network, rate limit and server errors are friendly and do not echo remote messages', async () => {
    for (const status of ['network', 429, 500, 503]) {
      reset(); await render(); await fill(valid);
      respond = async () => {
        if (status === 'network') throw new TypeError(`Failure with ${phrase}`);
        return response(status, { erro: phrase });
      };
      await submit();
      const message = document.querySelector('[role="alert"]').textContent;
      assert.equal(message.includes(phrase), false);
      assert.match(message, status === 'network' ? /conectar/ : status === 429 ? /Muitas tentativas/ : /Tente novamente/);
    }
  });
  await t.test('pending request prevents double submission', async () => {
    reset(); await render(); await fill(valid);
    let finish;
    respond = () => new Promise(resolve => { finish = resolve; });
    await act(async () => { dispatchSubmit(); dispatchSubmit(); });
    assert.equal(calls.length, 1);
    assert.equal(document.querySelector('button[type="submit"]').disabled, true);
    await act(async () => finish(response(400, { codigo: 'RECOVERY_INVALID' })));
    assert.ok(document.querySelector('[role="alert"]'));
  });
  await t.test('backend disabled response clears secrets and stops further submission', async () => {
    reset(); await render(); await fill(valid);
    respond = async () => response(403, { codigo: 'RECOVERY_DISABLED', erro: phrase });
    await submit();
    assert.equal(calls.length, 1);
    assert.equal(document.querySelector('form'), null);
    assert.equal(document.querySelector('input'), null);
    assert.ok(document.body.textContent.includes('Recuperação indisponível'));
    assert.equal(document.body.textContent.includes(phrase), false);
    await act(async () => document.querySelector('a[href="/"]').click());
    assert.equal(calls.length, 1);
  });
  for (const [label, flag, production] of [['opt-out', 'false', false], ['production despite opt-in', 'true', true]]) {
    await t.test(`${label} blocks direct page, standalone form and Login navigation`, async () => {
      reset();
      const disabled = await modules(flag, production);
      for (const direct of [false, true]) {
        await render('/recuperar-senha', disabled, direct);
        assert.equal(document.querySelector('form'), null);
        assert.ok(document.body.textContent.includes('Recuperação indisponível'));
      }
      await render('/', disabled);
      assert.equal(document.querySelector('a[href="/recuperar-senha"]'), null);
      const trigger = Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Recuperar acesso'));
      assert.equal(trigger.type, 'button');
      assert.equal(document.querySelectorAll('.login-recovery-notice-trigger').length, 1);
      assert.equal(document.querySelectorAll('[role="status"]').length, 1);
      assert.ok(trigger.closest('form'));
      assert.equal(trigger.previousElementSibling.className, 'login-password-field');
      await act(async () => trigger.click());
      assert.ok(document.body.textContent.includes('A recuperação de senha ainda não está disponível.'));
      assert.equal(document.getElementById('route').textContent, '/');
      assert.equal(calls.length, 0);
    });
  }
});
