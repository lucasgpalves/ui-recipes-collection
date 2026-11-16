import {
  demoAddIngredientAlias,
  demoApproveIngredient,
  demoFetchEditorIngredientById,
  demoFetchEditorIngredients,
  demoMergeIngredients,
  demoRejectIngredient,
  demoReopenIngredient,
} from '../../../../demo/demoApi'
import { apiRequest } from '../../../../shared/api/client'
import { env } from '../../../../shared/config/env'

export type EditorIngredientStatus = 'pending' | 'approved' | 'rejected'

export type EditorIngredient = {
  id: number
  name: string | null
  description?: string | null
  status: EditorIngredientStatus | string | null
}

export type IngredientListQuery = {
  q?: string
  status?: EditorIngredientStatus
}

export function fetchEditorIngredients(query: IngredientListQuery = {}): Promise<EditorIngredient[]> {
  if (env.useDemoApi) return demoFetchEditorIngredients(query)
  const params = new URLSearchParams()
  if (query.q?.trim()) params.set('q', query.q.trim())
  if (query.status) params.set('status', query.status)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<EditorIngredient[]>(`/ingredients${suffix}`)
}

export function fetchEditorIngredientById(id: number): Promise<EditorIngredient> {
  if (env.useDemoApi) return demoFetchEditorIngredientById(id)
  return apiRequest<EditorIngredient>(`/ingredients/${id}`)
}

export function approveIngredient(id: number, body: { name?: string | null } = {}): Promise<void> {
  if (env.useDemoApi) return demoApproveIngredient(id, body)
  return apiRequest<void>(`/ingredients/${id}/approve`, { method: 'POST', body })
}

export function rejectIngredient(id: number): Promise<void> {
  if (env.useDemoApi) return demoRejectIngredient(id)
  return apiRequest<void>(`/ingredients/${id}/reject`, { method: 'POST' })
}

export function reopenIngredient(id: number): Promise<void> {
  if (env.useDemoApi) return demoReopenIngredient(id)
  return apiRequest<void>(`/ingredients/${id}/reopen`, { method: 'POST' })
}

export function mergeIngredients(
  targetId: number,
  sourceIngredientId: number,
): Promise<void> {
  if (env.useDemoApi) return demoMergeIngredients(targetId, sourceIngredientId)
  return apiRequest<void>(`/ingredients/${targetId}/merge`, {
    method: 'POST',
    body: { sourceIngredientId },
  })
}

export function addIngredientAlias(ingredientId: number, alias: string): Promise<void> {
  if (env.useDemoApi) return demoAddIngredientAlias(ingredientId, alias)
  return apiRequest<void>(`/ingredients/${ingredientId}/aliases`, {
    method: 'POST',
    body: { alias },
  })
}