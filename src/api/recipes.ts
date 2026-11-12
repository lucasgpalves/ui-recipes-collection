import { apiRequest } from './client'
import type { Category, Recipe, RecipeSummary, Review, TokenResponse } from './types'

export function fetchRecipes(): Promise<RecipeSummary[]> {
  return apiRequest<RecipeSummary[]>('/recipes')
}

export function fetchRecipe(id: number): Promise<Recipe> {
  return apiRequest<Recipe>(`/recipes/${id}`)
}

export function fetchCategories(): Promise<Category[]> {
  return apiRequest<Category[]>('/categories')
}

export function fetchReviews(): Promise<Review[]> {
  return apiRequest<Review[]>('/reviews')
}

export function loginRequest(username: string, password: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}
