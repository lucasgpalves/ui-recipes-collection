import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('env da API real (FN-UI-API-FETCH)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  async function loadEnv() {
    return import('./env')
  }

  it('AC-08 / RF-UI-API-09 / RNF-UI-API-03: demo ligado em build PROD falha', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '/api')
    vi.stubEnv('VITE_USE_DEMO_API', 'true')
    vi.stubEnv('PROD', 'true')

    await expect(loadEnv()).rejects.toThrow(
      /VITE_USE_DEMO_API=true is not allowed in production builds/,
    )
  })
})
