import {
  demoCreateRecipe,
  demoFetchCookRecipes,
  demoFetchRecipe,
  demoUpdateRecipe,
} from '../../../../demo/demoApi'
import { apiRequest } from '../../../../shared/api/client'
import { env } from '../../../../shared/config/env'
import type { Recipe, RecipeRequest, RecipeSummary } from '../../../../shared/api/types'

export async function fetchCookRecipes(authorUsername: string): Promise<Recipe[]> {
  if (env.useDemoApi) return demoFetchCookRecipes(authorUsername)
  const summaries = await apiRequest<RecipeSummary[]>('/recipes')
  return summaries
    .filter((item) => (item.userName ?? '').toLowerCase() === authorUsername.trim().toLowerCase())
    .map((item) => ({
      id: item.id,
      userName: item.userName,
      name: item.name,
      categoryName: item.categoryName,
      createdAt: null,
      preparationMethod: null,
      portions: null,
      ingredients: [],
      description: item.description ?? null,
      isPublished: null,
      isRated: null,
      imageUrl: item.imageUrl,
    }))
}

export function fetchCookRecipe(id: number): Promise<Recipe> {
  if (env.useDemoApi) return demoFetchRecipe(id)
  return apiRequest<Recipe>(`/recipes/${id}`)
}

export function createRecipe(body: RecipeRequest, authorUsername: string): Promise<Recipe | void> {
  if (env.useDemoApi) return demoCreateRecipe(body, authorUsername)
  return apiRequest<void>('/recipes', { method: 'POST', body })
}

export function updateRecipe(
  id: number,
  body: RecipeRequest,
  authorUsername: string,
): Promise<Recipe | void> {
  if (env.useDemoApi) return demoUpdateRecipe(id, body, authorUsername)
  return apiRequest<void>(`/recipes/${id}`, { method: 'PUT', body })
}
