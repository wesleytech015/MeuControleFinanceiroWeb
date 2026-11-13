import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveApiUrl } from './src/services/apiUrl.js'

// Recharts 3.8.1 imports CommonJS-only es-toolkit subpaths. Vite 8's
// conversion can emit self-shadowing require helpers. Use the same compat
// functions through their public ESM entry in both dev optimization and build.
function rechartsEsmCompat() {
  return {
    name: 'recharts-esm-compat',
    transform(code, id) {
      if (!/[/\\]recharts[/\\]es6[/\\]/.test(id)) return null
      const result = code.replace(
        /import (\w+) from ['"]es-toolkit\/compat\/(\w+)['"];?/g,
        'import { $2 as $1 } from "es-toolkit/compat";'
      )
      return result === code ? null : { code: result, map: null }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    resolveApiUrl(env.VITE_API_URL, true)
  }

  return {
    plugins: [react(), rechartsEsmCompat()],
    optimizeDeps: {
      rolldownOptions: { plugins: [rechartsEsmCompat()] },
    },
  }
})
