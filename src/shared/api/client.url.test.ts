import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// RF-UI-API-02 — URLs = {apiBaseUrl}{path} via apiRequest / recipeDownloadUrl (módulos reais).

const fetchMock = vi.fn()

async function importClient() {
  vi.resetModules()
  return import('./client')
}

describe('RF-UI-API-02: construção de URL {apiBaseUrl}{path}', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test')
    vi.stubEnv('VITE_USE_DEMO_API', 'false')
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('apiRequest com path iniciando em / usa {apiBaseUrl}{path}', async () => {
    const { apiRequest } = await importClient()

    await apiRequest('/recipes')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/recipes')
  })

  it('apiRequest com path sem barra inicial normaliza para /{path}', async () => {
    const { apiRequest } = await importClient()

    await apiRequest('recipes')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/recipes')
  })

  it('recipeDownloadUrl usa {apiBaseUrl}/recipes/{id}/download', async () => {
    const { recipeDownloadUrl } = await importClient()

    expect(recipeDownloadUrl(42)).toBe('http://api.test/recipes/42/download')
  })

  it('respeita apiBaseUrl trimado (barra final removida no env)', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test/')
    const { apiRequest, recipeDownloadUrl } = await importClient()

    await apiRequest('/recipes')

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/recipes')
    expect(recipeDownloadUrl(1)).toBe('http://api.test/recipes/1/download')
  })
})
