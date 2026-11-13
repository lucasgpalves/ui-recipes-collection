import {
  demoFetchRecipe,
  demoFetchRecipes,
  demoFetchReviews,
} from '../../../demo/demoApi'
import { env } from '../../../shared/config/env'
import { apiRequest } from '../../../shared/api/client'
import type { Recipe, RecipeSummary, Review } from '../../../shared/api/types'

export function fetchRecipes(): Promise<RecipeSummary[]> {
  if (env.useDemoApi) return demoFetchRecipes()
  return apiRequest<RecipeSummary[]>('/recipes')
}

export function fetchRecipe(id: number): Promise<Recipe> {
  if (env.useDemoApi) return demoFetchRecipe(id)
  return apiRequest<Recipe>(`/recipes/${id}`)
}

export function fetchReviews(): Promise<Review[]> {
  if (env.useDemoApi) return demoFetchReviews()
  return apiRequest<Review[]>('/reviews')
}
