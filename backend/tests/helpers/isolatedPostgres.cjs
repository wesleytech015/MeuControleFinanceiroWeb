const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { Pool } = require('pg');

// Nunca aceita URL ou credenciais externas. Cada execução cria seu próprio cluster.
function binary(name) {
  const executable = name + (process.platform === 'win32' ? '.exe' : '');
  if (process.env.PG_TEST_BIN) return path.join(process.env.PG_TEST_BIN, executable);
  if (process.platform === 'win32') {
    for (const version of ['18', '17', '16', '15']) {
      const candidate = path.join('C:/Program Files/PostgreSQL', version, 'bin', executable);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return executable;
}
function available() {
  return spawnSync(binary('initdb'), ['--version'], { windowsHide: true }).status === 0;
}
function run(name, args) {
  const result = spawnSync(binary(name), args, { encoding: 'utf8', windowsHide: true, timeout: 30000 });
  if (result.status !== 0) throw new Error(`${name}: ${result.error?.message || result.stderr || result.stdout}`);
}
async function start() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mcf-recovery-test-'));
  const data = path.join(directory, 'data');
  const passwordFile = path.join(directory, 'password');
  const password = crypto.randomBytes(24).toString('hex');
  fs.writeFileSync(passwordFile, password, { mode: 0o600 });
  const socket = net.createServer();
  await new Promise((resolve, reject) => { socket.once('error', reject); socket.listen(0, '127.0.0.1', resolve); });
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  let started = false;
  let pool;
  const stop = async () => {
    try { if (pool) await pool.end(); } finally {
      if (started) run('pg_ctl', ['-D', data, '-m', 'immediate', '-w', 'stop']);
      if (path.dirname(directory) !== os.tmpdir() || !path.basename(directory).startsWith('mcf-recovery-test-')) throw new Error('Unsafe test directory');
      fs.rmSync(directory, { recursive: true, force: true });
    }
  };
  try {
    run('initdb', ['-D', data, '-U', 'recovery_test', '--pwfile', passwordFile, '--auth=scram-sha-256', '--encoding=UTF8', '--no-locale']);
    fs.appendFileSync(path.join(data, 'postgresql.conf'), `\nlisten_addresses = '127.0.0.1'\nport = ${port}\n`);
    run('pg_ctl', ['-D', data, '-l', path.join(directory, 'server.log'), '-w', 'start']);
    started = true;
    pool = new Pool({ host: '127.0.0.1', port, user: 'recovery_test', password, database: 'postgres', ssl: false, max: 12, connectionTimeoutMillis: 5000 });
    return { pool, stop };
  } catch (error) { await stop(); throw error; }
}
module.exports = { available, start };
