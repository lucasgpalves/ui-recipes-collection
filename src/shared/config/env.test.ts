import { afterEach, describe, expect, it, vi } from 'vitest'

// RF-UI-API-02 / AC-09 — VITE_API_BASE_URL obrigatório; apiBaseUrl sem barra final.

async function importEnv() {
  vi.resetModules()
  return import('./env')
}

describe('RF-UI-API-02 / AC-09: VITE_API_BASE_URL obrigatório', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it.each([
    ['ausente (undefined)', undefined],
    ['vazio', ''],
    ['somente whitespace', '   \t  '],
  ] as const)(
    'falha ao carregar o módulo quando VITE_API_BASE_URL está %s',
    async (_label, value) => {
      vi.stubEnv('VITE_API_BASE_URL', value as string)
      vi.stubEnv('VITE_USE_DEMO_API', 'false')

      await expect(importEnv()).rejects.toThrow(/VITE_API_BASE_URL/)
    },
  )

  it('mensagem de erro é explícita sobre VITE_API_BASE_URL ausente', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('VITE_USE_DEMO_API', 'false')

    await expect(importEnv()).rejects.toThrow(
      'Missing public env VITE_API_BASE_URL. Copy .env.example to .env.local and set the value.',
    )
  })

  it('apiBaseUrl reflete o valor trimado sem barra final', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '  http://api.test/  ')
    vi.stubEnv('VITE_USE_DEMO_API', 'false')

    const { env } = await importEnv()

    expect(env.apiBaseUrl).toBe('http://api.test')
  })

  it('apiBaseUrl preserva base sem barra final', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test')
    vi.stubEnv('VITE_USE_DEMO_API', 'false')

    const { env } = await importEnv()

    expect(env.apiBaseUrl).toBe('http://api.test')
  })
})
