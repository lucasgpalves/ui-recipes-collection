import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// AC-05 (nível HTTP): com useDemoApi=false, as facades públicas disparam fetch real
// para a API, sem header Authorization e sem tocar em demoApi.

const mocks = vi.hoisted(() => ({
  env: { apiBaseUrl: 'http://api.test', useDemoApi: false },
  demoFetchRecipes: vi.fn(),
  demoFetchRecipe: vi.fn(),
  demoFetchReviews: vi.fn(),
  demoFetchCategories: vi.fn(),
}))

vi.mock('../config/env', () => ({ env: mocks.env }))
vi.mock('../../demo/demoApi', () => ({
  demoFetchRecipes: mocks.demoFetchRecipes,
  demoFetchRecipe: mocks.demoFetchRecipe,
  demoFetchReviews: mocks.demoFetchReviews,
  demoFetchCategories: mocks.demoFetchCategories,
}))

import { fetchCategories } from '../../features/catalog/api/categories'
import { fetchRecipe, fetchRecipes, fetchReviews } from '../../features/recipes/api/recipes'
import { setMemoryToken } from './client'

const fetchMock = vi.fn()

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function sentHeaders(call: number): Record<string, string> {
  return (fetchMock.mock.calls[call][1] as RequestInit).headers as Record<string, string>
}

describe('AC-05: leitura pública via HTTP real, sem token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockReset()
    mocks.env.useDemoApi = false
    setMemoryToken(null)
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    ['fetchRecipes', () => fetchRecipes(), 'http://api.test/recipes'],
    ['fetchRecipe', () => fetchRecipe(5), 'http://api.test/recipes/5'],
    ['fetchReviews', () => fetchReviews(), 'http://api.test/reviews'],
    ['fetchCategories', () => fetchCategories(), 'http://api.test/categories'],
  ])('%s faz fetch para %s sem Authorization', async (_name, call, expectedUrl) => {
    const payload = [{ id: 1 }]
    fetchMock.mockResolvedValue(jsonResponse(payload))

    await expect(call()).resolves.toEqual(payload)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(expectedUrl)
    expect(sentHeaders(0)).not.toHaveProperty('Authorization')
    expect(sentHeaders(0).Accept).toBe('application/json')
    expect(mocks.demoFetchRecipes).not.toHaveBeenCalled()
    expect(mocks.demoFetchRecipe).not.toHaveBeenCalled()
    expect(mocks.demoFetchReviews).not.toHaveBeenCalled()
    expect(mocks.demoFetchCategories).not.toHaveBeenCalled()
  })
})
