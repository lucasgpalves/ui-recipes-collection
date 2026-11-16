import {
  demoCreateReview,
  demoDeleteReview,
  demoFetchRecipe,
  demoFetchRecipes,
  demoFetchReviews,
  demoUpdateReview,
} from '../../../demo/demoApi'
import { env } from '../../../shared/config/env'
import { apiRequest } from '../../../shared/api/client'
import type {
  Recipe,
  RecipeSummary,
  Review,
  ReviewRequest,
  ReviewUpdateRequest,
} from '../../../shared/api/types'

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

export function createReview(body: ReviewRequest): Promise<void> {
  if (env.useDemoApi) return demoCreateReview(body)
  return apiRequest<void>('/reviews', { method: 'POST', body })
}

export function updateReview(id: number, body: ReviewUpdateRequest): Promise<void> {
  if (env.useDemoApi) return demoUpdateReview(id, body)
  return apiRequest<void>(`/reviews/${id}`, { method: 'PUT', body })
}

export function deleteReview(id: number): Promise<void> {
  if (env.useDemoApi) return demoDeleteReview(id)
  return apiRequest<void>(`/reviews/${id}`, { method: 'DELETE' })
}
