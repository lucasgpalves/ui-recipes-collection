import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFetchRecorder, installMemoryStorage, jsonResponse } from '../../../test-support/http'
import { createRecipe, fetchCookRecipes, updateRecipe } from './api/recipes'
import type { RecipeRequest } from '../../../shared/api/types'

vi.mock('../../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

const recipeBody: RecipeRequest = {
  userId: 42,
  name: 'Risoto',
  categoryName: 'Massas',
  preparationMethod: 'Mexer',
  portions: 2,
  preparationTime: 30,
  ingredientsRecipe: [{ amount: 1, ingredientName: 'arroz', measurementName: 'xícara' }],
  description: '',
}

describe('receitas do cook na API real (AC-07 / RF-UI-API-15 / RF-UI-API-16)', () => {
  beforeEach(() => {
    installMemoryStorage('sessionStorage')
    installMemoryStorage('localStorage')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lista com GET /recipes/mine', async () => {
    const { calls, fetch } = createFetchRecorder(() =>
      jsonResponse(200, [
        {
          id: 5,
          userId: 42,
          userName: 'chef',
          name: 'Risoto',
          categoryName: 'Massas',
        },
      ]),
    )
    vi.stubGlobal('fetch', fetch)

    const recipes = await fetchCookRecipes({ userId: 42, username: 'chef' })

    expect(calls[0]?.url).toBe('/api/recipes/mine')
    expect(calls[0]?.method).toBe('GET')
    expect(recipes[0]?.name).toBe('Risoto')
    expect(recipes[0]?.userId).toBe(42)
  })

  it('create envia o userId da sessão no corpo', async () => {
    const { calls, fetch } = createFetchRecorder(() => jsonResponse(201))
    vi.stubGlobal('fetch', fetch)

    await createRecipe(recipeBody, 'chef')

    expect(calls[0]?.url).toBe('/api/recipes')
    expect(calls[0]?.method).toBe('POST')
    expect(calls[0]?.body).toMatchObject({ userId: 42, name: 'Risoto' })
  })

  it('update envia o userId da sessão no corpo', async () => {
    const { calls, fetch } = createFetchRecorder(() => jsonResponse(200))
    vi.stubGlobal('fetch', fetch)

    await updateRecipe(9, recipeBody, 'chef')

    expect(calls[0]?.url).toBe('/api/recipes/9')
    expect(calls[0]?.method).toBe('PUT')
    expect(calls[0]?.body).toMatchObject({ userId: 42, name: 'Risoto' })
  })
})
