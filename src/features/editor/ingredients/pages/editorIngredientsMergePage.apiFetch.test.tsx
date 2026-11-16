// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComponentType } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NotifyProvider } from '../../../../shared/ui/notify'
import { createFetchRecorder, findToast, jsonResponse, type FetchCall } from '../../../../test-support/http'

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
    isEditor: true,
    role: 'EDITOR',
    isCook: false,
    isAdmin: false,
    token: null,
    login: async () => undefined,
    logout: () => undefined,
  }),
}))

async function loadPage(): Promise<ComponentType<object>> {
  try {
    const specifier = './EditorIngredientsMergePage'
    const mod = (await import(/* @vite-ignore */ specifier)) as {
      EditorIngredientsMergePage?: ComponentType<object>
    }
    if (typeof mod.EditorIngredientsMergePage !== 'function') {
      throw new Error('export EditorIngredientsMergePage ausente')
    }
    return mod.EditorIngredientsMergePage
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`FN-UI-EDITOR AC-05: EditorIngredientsMergePage não implementada (${detail}).`)
  }
}

describe('FN-UI-EDITOR AC-05 — merge de ingredientes', () => {
  let calls: FetchCall[] = []
  let mergeFails = false

  beforeEach(() => {
    mergeFails = false
    const recorder = createFetchRecorder((call) => {
      if (call.url.includes('/ingredients') && call.method === 'GET') {
        return jsonResponse(200, [
          { id: 1, name: 'Farinha', status: 'approved' },
          { id: 2, name: 'Farinha Tipo 1', status: 'approved' },
        ])
      }
      if (call.url.includes('/ingredients/1/merge')) {
        if (mergeFails) {
          return jsonResponse(409, { detail: 'Merge inválido' })
        }
        return new Response(null, { status: 204 })
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

  it('RF-UI-ED-10: confirmação envia POST merge e remove a origem da listagem', async () => {
    await renderPage()
    await screen.findByText('Farinha Tipo 1')

    fireEvent.change(screen.getByLabelText(/origem/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/destino/i), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar merge/i }))

    await waitFor(() => {
      expect(screen.queryByText('Farinha Tipo 1')).toBeNull()
    })

    const merge = calls.find((c) => c.url.includes('/ingredients/1/merge'))
    expect(merge?.method).toBe('POST')
    expect(merge?.body).toEqual({ sourceIngredientId: 2 })
  })

  it('RF-UI-ED-10: falha de merge exibe toast de erro', async () => {
    mergeFails = true
    await renderPage()
    await screen.findByText('Farinha Tipo 1')

    fireEvent.change(screen.getByLabelText(/origem/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/destino/i), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar merge/i }))

    await waitFor(() => {
      expect(findToast('error')).toBeTruthy()
    })
  })
})