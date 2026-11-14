import test from 'node:test';
import assert from 'node:assert/strict';
import { loginError } from '../src/services/loginError.js';

test('network and server failures do not accuse invalid credentials', () => {
  assert.equal(loginError(new TypeError('Failed to fetch')).credentials, false);
  assert.match(loginError(new TypeError('Failed to fetch')).message, /conectar/);
  assert.equal(loginError({ status: 500 }).credentials, false);
  assert.equal(loginError({ status: 401 }).credentials, true);
  assert.match(loginError({ status: 429 }).message, /Muitas tentativas/);
});
