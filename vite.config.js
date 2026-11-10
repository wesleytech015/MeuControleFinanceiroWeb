import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveApiUrl } from './src/services/apiUrl.js'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    resolveApiUrl(env.VITE_API_URL, true)
  }

  return {
    plugins: [react()],
  }
})
