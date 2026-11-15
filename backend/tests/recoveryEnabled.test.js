const test = require('node:test');
const assert = require('node:assert/strict');
const enabled = require('../middlewares/recoveryEnabled');

test('recovery opt-in is strict and independent of NODE_ENV, with no permissive fallback', () => {
  const previousEnv = process.env.NODE_ENV;
  const previousFlag = process.env.RECOVERY_ENABLED;
  try {
    for (const environment of ['production', 'development', 'test']) {
      process.env.NODE_ENV = environment;
      for (const flag of [undefined, '', 'false', 'TRUE', '1', ' true ', 'true']) {
        if (flag === undefined) delete process.env.RECOVERY_ENABLED; else process.env.RECOVERY_ENABLED = flag;
        let nextCalls = 0;
        const res = { statusCode: 200, headers: {}, status(value) { this.statusCode = value; return this; },
          set(name, value) { this.headers[name] = value; return this; }, json(body) { this.body = body; return this; } };
        enabled({}, res, () => nextCalls++);
        assert.equal(nextCalls, flag === 'true' ? 1 : 0);
        assert.equal(res.statusCode, flag === 'true' ? 200 : 403);
        if (flag !== 'true') {
          assert.equal(res.body.codigo, 'RECOVERY_DISABLED');
          assert.equal(res.headers['Cache-Control'], 'no-store');
        }
      }
    }
  } finally {
    if (previousEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnv;
    if (previousFlag === undefined) delete process.env.RECOVERY_ENABLED; else process.env.RECOVERY_ENABLED = previousFlag;
  }
});
