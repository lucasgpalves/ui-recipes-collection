// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComponentType } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NotifyProvider } from '../../../../shared/ui/notify'
import { createFetchRecorder, jsonResponse, type FetchCall } from '../../../../test-support/http'

vi.mock('../../../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

vi.mock('../../../auth', () => ({
  useAuth: () => ({
    username: 'editor',
    userId: 12,
    isAuthenticated: true,
    isCook: false,
    isAdmin: false,
    isEditor: true,
    role: 'EDITOR',
    token: null,
    login: async () => undefined,
    logout: () => undefined,
  }),
}))

async function loadPage(): Promise<ComponentType<object>> {
  try {
    const specifier = './EditorIngredientsListPage'
    const mod = (await import(/* @vite-ignore */ specifier)) as {
      EditorIngredientsListPage?: ComponentType<object>
    }
    if (typeof mod.EditorIngredientsListPage !== 'function') {
      throw new Error('export EditorIngredientsListPage ausente')
    }
    return mod.EditorIngredientsListPage
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`FN-UI-EDITOR AC-04: EditorIngredientsListPage não implementada (${detail}).`)
  }
}

describe('FN-UI-EDITOR AC-04 — status de ingredientes', () => {
  let calls: FetchCall[] = []
  let ingredients = [{ id: 5, name: 'Farinha', status: 'pending' as const }]

  beforeEach(() => {
    ingredients = [{ id: 5, name: 'Farinha', status: 'pending' }]
    const recorder = createFetchRecorder((call) => {
      if (call.url.includes('/ingredients/5/approve')) {
        ingredients[0] = { ...ingredients[0]!, status: 'approved' }
        return new Response(null, { status: 204 })
      }
      if (call.url.includes('/ingredients/5/reject')) {
        ingredients[0] = { ...ingredients[0]!, status: 'rejected' }
        return new Response(null, { status: 204 })
      }
      if (call.url.includes('/ingredients/5/reopen')) {
        ingredients[0] = { ...ingredients[0]!, status: 'pending' }
        return new Response(null, { status: 204 })
      }
      if (call.url.endsWith('/ingredients') || call.url.includes('/ingredients?')) {
        return jsonResponse(200, ingredients)
      }
      return jsonResponse(404, {})
    })
    calls = recorder.calls
    vi.stubGlobal('fetch', recorder.fetch)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  async function renderPage() {
    const Page = await loadPage()
    return render(
      <MemoryRouter>
        <NotifyProvider>
          <Page />
        </NotifyProvider>
      </MemoryRouter>,
    )
  }

  it('RF-UI-ED-08: aprovar dispara POST /ingredients/{id}/approve e atualiza status', async () => {
    await renderPage()
    expect(await screen.findByText('Farinha')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /aprovar/i }))
    await waitFor(() => {
      expect(screen.getByText(/aprovad/i)).toBeTruthy()
    })

    const approve = calls.find((c) => c.url.includes('/ingredients/5/approve'))
    expect(approve?.method).toBe('POST')
    expect(approve?.body).toEqual({})
  })

  it('RF-UI-ED-08: rejeitar dispara POST /ingredients/{id}/reject', async () => {
    await renderPage()
    await screen.findByText('Farinha')

    fireEvent.click(screen.getByRole('button', { name: /rejeitar/i }))
    await waitFor(() => {
      expect(screen.getByText(/rejeitad/i)).toBeTruthy()
    })

    expect(calls.some((c) => c.url.includes('/ingredients/5/reject') && c.method === 'POST')).toBe(
      true,
    )
  })

  it('RF-UI-ED-08: reabrir dispara POST /ingredients/{id}/reopen', async () => {
    ingredients = [{ id: 5, name: 'Farinha', status: 'approved' }]
    await renderPage()
    await screen.findByText('Farinha')

    fireEvent.click(screen.getByRole('button', { name: /reabrir/i }))
    await waitFor(() => {
      expect(screen.getByText(/pendente/i)).toBeTruthy()
    })

    expect(calls.some((c) => c.url.includes('/ingredients/5/reopen') && c.method === 'POST')).toBe(
      true,
    )
  })
})