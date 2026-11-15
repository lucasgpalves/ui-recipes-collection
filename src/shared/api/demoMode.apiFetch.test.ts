import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCookRecipes } from '../../features/cook/recipes/api/recipes'

vi.mock('../config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: true,
  },
}))

describe('regressão demo (RF-UI-API-08)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('listagens públicas e do cook não chamam a API HTTP real', async () => {
    const urls: string[] = []
    vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
      urls.push(String(input))
      return Promise.resolve(new Response('[]', { status: 200 }))
    })

    await fetchCookRecipes({ userId: 1, username: 'cook' }).catch(() => undefined)

    const hit = urls.filter((url) => url.includes('/api/recipes') || url.includes('/recipes/mine'))
    expect(hit).toEqual([])
  })
})
