import type { Category, Recipe, RecipeSummary, Review, TokenResponse } from '../shared/api/types'
import { ApiError } from '../shared/api/client'

const DEMO_LATENCY_MS = 420

async function demoRequest<T>(fixtureUrl: string, latency = DEMO_LATENCY_MS): Promise<T> {
  const started = performance.now()
  const response = await fetch(fixtureUrl, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new ApiError(response.status, `Demo request failed with status ${response.status}`)
  }

  const data = (await response.json()) as T
  const elapsed = performance.now() - started
  const wait = Math.max(0, latency - elapsed)
  if (wait > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, wait))
  }
  return data
}

export function demoFetchRecipes(): Promise<RecipeSummary[]> {
  return demoRequest(new URL('./fixtures/recipes.json', import.meta.url).href)
}

export async function demoFetchRecipe(id: number): Promise<Recipe> {
  const recipes = await demoRequest<Recipe[]>(
    new URL('./fixtures/recipe-details.json', import.meta.url).href,
  )
  const recipe = recipes.find((item) => item.id === id)
  if (!recipe) {
    throw new ApiError(404, `Demo recipe ${id} not found`)
  }
  return structuredClone(recipe)
}

export function demoFetchCategories(): Promise<Category[]> {
  return demoRequest(new URL('./fixtures/categories.json', import.meta.url).href, 280)
}

export function demoFetchReviews(): Promise<Review[]> {
  return demoRequest(new URL('./fixtures/reviews.json', import.meta.url).href, 320)
}

export async function demoLogin(username: string, password: string): Promise<TokenResponse> {
  await new Promise((resolve) => window.setTimeout(resolve, 500))
  if (!username.trim() || !password.trim()) {
    throw new ApiError(401, 'Credenciais inválidas')
  }
  return { token: `demo-token.${btoa(username)}.${Date.now()}` }
}
