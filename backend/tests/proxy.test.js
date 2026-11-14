const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { trustedProxies } = require('../config/proxy');

test('proxy configuration defaults to disabled and rejects broad/invalid trust options', () => {
  assert.equal(trustedProxies(), false);
  assert.equal(trustedProxies('  '), false);
  for (const value of ['true', '1', '*', '0.0.0.0/0', '::/0', '127.0.0.1/33', '::1/129', 'example.com', '127.0.0.1,', '127.0.0.1/-1']) {
    assert.throws(() => trustedProxies(value));
  }
  assert.deepEqual(trustedProxies('192.0.2.1, 2001:db8::/64'), ['192.0.2.1', '2001:db8::/64']);
});

test('Express only follows forwarded chains through explicitly trusted proxies', () => {
  const app = express();
  app.set('trust proxy', trustedProxies('192.0.2.1,2001:db8::/64'));
  const trust = app.get('trust proxy fn');
  assert.equal(trust('192.0.2.1'), true);
  assert.equal(trust('192.0.2.2'), false);
  assert.equal(trust('2001:db8::123'), true);
  assert.equal(trust('127.0.0.1'), false);
});
