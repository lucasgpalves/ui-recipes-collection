import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFetchRecorder, installMemoryStorage, jsonResponse } from '../../../../test-support/http'
import { fetchEditorialRecipes } from './editorial'

vi.mock('../../../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

describe('FN-UI-EDITOR — editorial API (RF-UI-ED-11 / AC-07)', () => {
  beforeEach(() => {
    installMemoryStorage('sessionStorage')
    installMemoryStorage('localStorage')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('GET /recipes/editorial com filtros mínimos', async () => {
    const { calls, fetch } = createFetchRecorder(() =>
      jsonResponse(200, [{ id: 1, name: 'Bolo', isRated: true, isPublished: false }]),
    )
    vi.stubGlobal('fetch', fetch)

    await fetchEditorialRecipes({
      category: 'Doces',
      isRated: true,
      isPublished: false,
      userId: 12,
      chefName: 'Ana',
      q: 'bolo',
      ingredientsStatus: 'approved',
    })

    const url = new URL(calls[0]?.url ?? '', 'http://ui.test')
    expect(url.pathname).toBe('/api/recipes/editorial')
    expect(url.searchParams.get('category')).toBe('Doces')
    expect(url.searchParams.get('isRated')).toBe('true')
    expect(url.searchParams.get('isPublished')).toBe('false')
    expect(url.searchParams.get('userId')).toBe('12')
    expect(url.searchParams.get('chefName')).toBe('Ana')
    expect(url.searchParams.get('q')).toBe('bolo')
    expect(url.searchParams.get('ingredientsStatus')).toBe('approved')
    expect(calls[0]?.method).toBe('GET')
  })
})