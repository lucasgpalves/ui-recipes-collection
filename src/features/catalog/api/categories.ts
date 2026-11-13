import { demoFetchCategories } from '../../../demo/demoApi'
import { env } from '../../../shared/config/env'
import { apiRequest } from '../../../shared/api/client'
import type { Category } from '../../../shared/api/types'

export function fetchCategories(): Promise<Category[]> {
  if (env.useDemoApi) return demoFetchCategories()
  return apiRequest<Category[]>('/categories')
}
