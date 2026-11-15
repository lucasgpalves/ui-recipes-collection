// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import type { ComponentType } from 'react'
import { NotifyProvider } from '../../../shared/ui/notify'
import { createFetchRecorder, findToast, jsonResponse, type FetchCall } from '../../../test-support/http'

vi.mock('../../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

type GoalProgressPanelProps = {
  goalId: number | null
  userId: number
  month?: number
  year?: number
}

/**
 * Contrato do teste (a spec não nomeia o arquivo):
 * export function GoalProgressPanel em features/admin/goals/components/GoalProgressPanel.tsx
 * Props: goalId, userId e, quando informados, month e year.
 */
async function loadPanel(): Promise<ComponentType<GoalProgressPanelProps>> {
  try {
    const specifier = './components/GoalProgressPanel.tsx'
    const mod = (await import(/* @vite-ignore */ specifier)) as {
      GoalProgressPanel?: ComponentType<GoalProgressPanelProps>
    }
    if (typeof mod.GoalProgressPanel !== 'function') {
      throw new Error('export nomeado GoalProgressPanel ausente')
    }
    return mod.GoalProgressPanel
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(
      `AC-11 / RF-UI-API-20…22: UI GoalProgress ainda não atende ao contrato (${detail}).`,
    )
  }
}

describe('UI GoalProgress (AC-11 / RF-UI-API-20…22)', () => {
  let calls: FetchCall[] = []
  let status = 200

  beforeEach(() => {
    status = 200
    const recorder = createFetchRecorder(() =>
      status === 200
        ? jsonResponse(200, { userId: 481, target: 640, progress: 17 })
        : jsonResponse(status, {}),
    )
    calls = recorder.calls
    vi.stubGlobal('fetch', recorder.fetch)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  function progressCalls() {
    return calls.filter((call) => call.url.includes('/progress'))
  }

  it('RF-UI-API-22: meta sem id não busca progresso', async () => {
    const Panel = await loadPanel()
    render(
      <NotifyProvider>
        <Panel goalId={null} userId={481} />
      </NotifyProvider>,
    )
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(progressCalls()).toHaveLength(0)
  })

  it('AC-11: busca GET /goals/{id}/progress e exibe userId, target e progress', async () => {
    const Panel = await loadPanel()
    render(
      <NotifyProvider>
        <Panel goalId={10} userId={481} month={11} year={2026} />
      </NotifyProvider>,
    )

    expect(await screen.findByText('481')).toBeTruthy()
    expect(screen.getByText('640')).toBeTruthy()
    expect(screen.getByText('17')).toBeTruthy()

    const url = new URL(progressCalls()[0]?.url ?? '', 'http://ui.test')
    expect(url.pathname).toBe('/api/goals/10/progress')
    expect(url.searchParams.get('userId')).toBe('481')
    expect(url.searchParams.get('month')).toBe('11')
    expect(url.searchParams.get('year')).toBe('2026')
  })

  it('omite month e year quando a UI não informa', async () => {
    const Panel = await loadPanel()
    render(
      <NotifyProvider>
        <Panel goalId={10} userId={481} />
      </NotifyProvider>,
    )

    await waitFor(() => {
      expect(progressCalls().length).toBeGreaterThan(0)
    })
    const url = new URL(progressCalls()[0]?.url ?? '', 'http://ui.test')
    expect(url.searchParams.get('userId')).toBe('481')
    expect(url.searchParams.get('month')).toBeNull()
    expect(url.searchParams.get('year')).toBeNull()
  })

  it('RF-UI-API-22: falha de carga gera toast error', async () => {
    status = 500
    const Panel = await loadPanel()
    render(
      <NotifyProvider>
        <Panel goalId={10} userId={481} />
      </NotifyProvider>,
    )

    await waitFor(() => {
      expect(findToast('error')).toBeTruthy()
    })
  })
})
