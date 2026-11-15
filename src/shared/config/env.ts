function required(name: keyof ImportMetaEnv, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(
      `Missing public env ${String(name)}. Copy .env.example to .env.local and set the value.`,
    )
  }
  return value.trim().replace(/\/$/, '')
}

function flag(value: string | undefined, fallback = false): boolean {
  if (value == null || value.trim() === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

const useDemoApi = flag(import.meta.env.VITE_USE_DEMO_API, false)

// F-02: fail-fast se demo for ligado em build de produção Vite.
if (useDemoApi && import.meta.env.PROD) {
  throw new Error(
    'VITE_USE_DEMO_API=true is not allowed in production builds. Set VITE_USE_DEMO_API=false.',
  )
}

export const env = {
  apiBaseUrl: required('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
  /** Quando true, a camada de API usa fixtures JSON com latência simulada. */
  useDemoApi,
}
