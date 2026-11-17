import {
  demoCreateGoal,
  demoDeleteGoal,
  demoFetchGoalById,
  demoFetchGoalProgress,
  demoFetchGoals,
  demoUpdateGoal,
} from '../../../../demo/demoApi'
import { apiRequest } from '../../../../shared/api/client'
import { env } from '../../../../shared/config/env'
import type { Goal, GoalProgress, GoalRequest } from '../../../../shared/api/types'

export type GoalProgressQuery = {
  userId: number
  month?: number
  year?: number
}

export function fetchGoals(): Promise<Goal[]> {
  if (env.useDemoApi) return demoFetchGoals()
  return apiRequest<Goal[]>('/goals')
}

export function fetchGoalById(id: number): Promise<Goal> {
  if (env.useDemoApi) return demoFetchGoalById(id)
  return apiRequest<Goal>(`/goals/${id}`)
}

export function createGoal(body: GoalRequest): Promise<Goal | void> {
  if (env.useDemoApi) return demoCreateGoal(body)
  return apiRequest<void>('/goals', { method: 'POST', body })
}

export function updateGoal(id: number, body: GoalRequest): Promise<Goal | void> {
  if (env.useDemoApi) return demoUpdateGoal(id, body)
  return apiRequest<void>(`/goals/${id}`, { method: 'PUT', body })
}

export function deleteGoal(id: number): Promise<void> {
  if (env.useDemoApi) return demoDeleteGoal(id)
  return apiRequest<void>(`/goals/${id}`, { method: 'DELETE' })
}

export function fetchGoalProgress(id: number, query: GoalProgressQuery): Promise<GoalProgress> {
  if (env.useDemoApi) return demoFetchGoalProgress(id, query)
  const params = new URLSearchParams()
  params.set('userId', String(query.userId))
  if (query.month != null) params.set('month', String(query.month))
  if (query.year != null) params.set('year', String(query.year))
  return apiRequest<GoalProgress>(`/goals/${id}/progress?${params.toString()}`)
}
