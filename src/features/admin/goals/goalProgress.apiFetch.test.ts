import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GoalProgress } from '../../../shared/api/types'
import { createFetchRecorder, installMemoryStorage, jsonResponse } from '../../../test-support/http'
import * as goalsApi from './api/goals'

vi.mock('../../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

type ProgressQuery = { userId: number; month?: number; year?: number }

function fetchGoalProgress(id: number, query: ProgressQuery): Promise<GoalProgress> {
  const fn = (goalsApi as { fetchGoalProgress?: (id: number, query: ProgressQuery) => Promise<GoalProgress> })
    .fetchGoalProgress
  if (typeof fn !== 'function') {
    throw new Error(
      'RF-UI-API-20: export fetchGoalProgress(id, { userId, month?, year? }) ausente em features/admin/goals/api/goals.ts',
    )
  }
  return fn(id, query)
}

describe('GET /goals/{id}/progress (RF-UI-API-20 / AC-11)', () => {
  beforeEach(() => {
    installMemoryStorage('sessionStorage')
    installMemoryStorage('localStorage')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('consulta userId e omite month/year quando não informados', async () => {
    const { calls, fetch } = createFetchRecorder(() =>
      jsonResponse(200, { userId: 7, target: 10, progress: 2 }),
    )
    vi.stubGlobal('fetch', fetch)

    const progress = await fetchGoalProgress(10, { userId: 7 })
    const url = new URL(calls[0]?.url ?? '', 'http://ui.test')

    expect(url.pathname).toBe('/api/goals/10/progress')
    expect(url.searchParams.get('userId')).toBe('7')
    expect(url.searchParams.get('month')).toBeNull()
    expect(url.searchParams.get('year')).toBeNull()
    expect(progress).toEqual({ userId: 7, target: 10, progress: 2 })
  })

  it('inclui month e year quando informados', async () => {
    const { calls, fetch } = createFetchRecorder(() =>
      jsonResponse(200, { userId: 7, target: 10, progress: 4 }),
    )
    vi.stubGlobal('fetch', fetch)

    await fetchGoalProgress(10, { userId: 7, month: 11, year: 2026 })
    const url = new URL(calls[0]?.url ?? '', 'http://ui.test')

    expect(url.pathname).toBe('/api/goals/10/progress')
    expect(url.searchParams.get('userId')).toBe('7')
    expect(url.searchParams.get('month')).toBe('11')
    expect(url.searchParams.get('year')).toBe('2026')
  })
})
