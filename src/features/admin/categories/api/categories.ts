import {
  demoCreateCategory,
  demoDeleteCategory,
  demoFetchCategories,
  demoFetchCategoryById,
  demoUpdateCategory,
} from '../../../../demo/demoApi'
import { apiRequest } from '../../../../shared/api/client'
import { env } from '../../../../shared/config/env'
import type { Category, CategoryRequest } from '../../../../shared/api/types'

export function fetchAdminCategories(): Promise<Category[]> {
  if (env.useDemoApi) return demoFetchCategories()
  return apiRequest<Category[]>('/categories')
}

export function fetchCategoryById(id: number): Promise<Category> {
  if (env.useDemoApi) return demoFetchCategoryById(id)
  return apiRequest<Category>(`/categories/${id}`)
}

export function createCategory(body: CategoryRequest): Promise<Category | void> {
  if (env.useDemoApi) return demoCreateCategory(body)
  return apiRequest<void>('/categories', { method: 'POST', body })
}

export function updateCategory(id: number, body: CategoryRequest): Promise<Category | void> {
  if (env.useDemoApi) return demoUpdateCategory(id, body)
  return apiRequest<void>(`/categories/${id}`, { method: 'PUT', body })
}

export function deleteCategory(id: number): Promise<void> {
  if (env.useDemoApi) return demoDeleteCategory(id)
  return apiRequest<void>(`/categories/${id}`, { method: 'DELETE' })
}
