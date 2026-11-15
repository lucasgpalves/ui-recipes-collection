import { beforeEach, describe, expect, it, vi } from 'vitest'

// RF-UI-API-01 / AC-05 — com VITE_USE_DEMO_API=false, facades públicas usam apiRequest (HTTP), não demoApi.

const mocks = vi.hoisted(() => ({
  env: { apiBaseUrl: 'http://api.test', useDemoApi: false },
  apiRequest: vi.fn(),
  demoFetchRecipes: vi.fn(),
  demoFetchRecipe: vi.fn(),
  demoFetchReviews: vi.fn(),
  demoFetchCategories: vi.fn(),
}))

vi.mock('../../../shared/config/env', () => ({ env: mocks.env }))
vi.mock('../../../shared/api/client', () => ({ apiRequest: mocks.apiRequest }))
vi.mock('../../../demo/demoApi', () => ({
  demoFetchRecipes: mocks.demoFetchRecipes,
  demoFetchRecipe: mocks.demoFetchRecipe,
  demoFetchReviews: mocks.demoFetchReviews,
  demoFetchCategories: mocks.demoFetchCategories,
}))

import { fetchCategories } from '../../catalog/api/categories'
import { fetchRecipe, fetchRecipes, fetchReviews } from './recipes'

function expectNoDemoCalls() {
  expect(mocks.demoFetchRecipes).not.toHaveBeenCalled()
  expect(mocks.demoFetchRecipe).not.toHaveBeenCalled()
  expect(mocks.demoFetchReviews).not.toHaveBeenCalled()
  expect(mocks.demoFetchCategories).not.toHaveBeenCalled()
}

describe('RF-UI-API-01 / AC-05: useDemoApi=false usa HTTP via apiRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.env.useDemoApi = false
  })

  it('fetchRecipes (home/busca) chama GET /recipes sem token e sem demoApi', async () => {
    const payload = [{ id: 1 }]
    mocks.apiRequest.mockResolvedValue(payload)

    await expect(fetchRecipes()).resolves.toBe(payload)

    expect(mocks.apiRequest).toHaveBeenCalledTimes(1)
    expect(mocks.apiRequest).toHaveBeenCalledWith('/recipes')
    expectNoDemoCalls()
  })

  it('fetchRecipe (detalhe) chama GET /recipes/:id sem token e sem demoApi', async () => {
    const payload = { id: 7 }
    mocks.apiRequest.mockResolvedValue(payload)

    await expect(fetchRecipe(7)).resolves.toBe(payload)

    expect(mocks.apiRequest).toHaveBeenCalledTimes(1)
    expect(mocks.apiRequest).toHaveBeenCalledWith('/recipes/7')
    expectNoDemoCalls()
  })

  it('fetchReviews chama GET /reviews sem token e sem demoApi', async () => {
    const payload = [{ id: 3 }]
    mocks.apiRequest.mockResolvedValue(payload)

    await expect(fetchReviews()).resolves.toBe(payload)

    expect(mocks.apiRequest).toHaveBeenCalledTimes(1)
    expect(mocks.apiRequest).toHaveBeenCalledWith('/reviews')
    expectNoDemoCalls()
  })

  it('fetchCategories chama GET /categories sem token e sem demoApi', async () => {
    const payload = [{ id: 2, name: 'Massas' }]
    mocks.apiRequest.mockResolvedValue(payload)

    await expect(fetchCategories()).resolves.toBe(payload)

    expect(mocks.apiRequest).toHaveBeenCalledTimes(1)
    expect(mocks.apiRequest).toHaveBeenCalledWith('/categories')
    expectNoDemoCalls()
  })

  it('propaga falhas HTTP do apiRequest (sem fallback para demoApi)', async () => {
    const error = new Error('Request failed with status 500')
    mocks.apiRequest.mockRejectedValue(error)

    await expect(fetchRecipes()).rejects.toBe(error)
    await expect(fetchCategories()).rejects.toBe(error)

    expectNoDemoCalls()
  })
})

describe('Controle: useDemoApi=true usa demoApi e não HTTP', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.env.useDemoApi = true
  })

  it('fetchRecipes, fetchRecipe, fetchReviews e fetchCategories usam demoApi', async () => {
    mocks.demoFetchRecipes.mockResolvedValue([])
    mocks.demoFetchRecipe.mockResolvedValue({ id: 1 })
    mocks.demoFetchReviews.mockResolvedValue([])
    mocks.demoFetchCategories.mockResolvedValue([])

    await fetchRecipes()
    await fetchRecipe(1)
    await fetchReviews()
    await fetchCategories()

    expect(mocks.demoFetchRecipes).toHaveBeenCalledTimes(1)
    expect(mocks.demoFetchRecipe).toHaveBeenCalledWith(1)
    expect(mocks.demoFetchReviews).toHaveBeenCalledTimes(1)
    expect(mocks.demoFetchCategories).toHaveBeenCalledTimes(1)
    expect(mocks.apiRequest).not.toHaveBeenCalled()
  })
})
