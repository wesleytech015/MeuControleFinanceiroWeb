const path = require('node:path');
function loadEnvironment() {
  const dotenv = require('dotenv');
  const inherited = new Set(Object.keys(process.env));
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
  // Platform variables win; local assistant settings override .env defaults only in development.
  if (process.env.NODE_ENV !== 'production' && !process.env.RENDER && !process.env.VERCEL) {
    const local = {};
    dotenv.config({ path: path.resolve(__dirname, '../../.env.assistant.local'), quiet: true, processEnv: local });
    for (const [key, value] of Object.entries(local)) {
      if (!inherited.has(key)) process.env[key] = value;
    }
  }
}
module.exports = { loadEnvironment };
