import { demoFetchEditorialRecipes } from '../../../../demo/demoApi'
import { apiRequest } from '../../../../shared/api/client'
import { env } from '../../../../shared/config/env'

export type EditorialRecipeSummary = {
  id: number
  name: string | null
  userId?: number | null
  userName?: string | null
  /** Demo / UI convenience; API real usa `userName`. */
  chefName?: string | null
  categoryName?: string | null
  isRated?: boolean | null
  isPublished?: boolean | null
}

export type EditorialFilter = {
  category?: string
  isRated?: boolean
  isPublished?: boolean
  userId?: number
  chefName?: string
  q?: string
  ingredientsStatus?: string
}

function buildEditorialQuery(filter: EditorialFilter): string {
  const params = new URLSearchParams()
  if (filter.category?.trim()) params.set('category', filter.category.trim())
  if (filter.isRated !== undefined) params.set('isRated', String(filter.isRated))
  if (filter.isPublished !== undefined) params.set('isPublished', String(filter.isPublished))
  if (filter.userId !== undefined) params.set('userId', String(filter.userId))
  if (filter.chefName?.trim()) params.set('chefName', filter.chefName.trim())
  if (filter.q?.trim()) params.set('q', filter.q.trim())
  if (filter.ingredientsStatus?.trim()) {
    params.set('ingredientsStatus', filter.ingredientsStatus.trim())
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function fetchEditorialRecipes(filter: EditorialFilter = {}): Promise<EditorialRecipeSummary[]> {
  if (env.useDemoApi) return demoFetchEditorialRecipes(filter)
  const query = buildEditorialQuery(filter)
  return apiRequest<EditorialRecipeSummary[]>(`/recipes/editorial${query}`)
}