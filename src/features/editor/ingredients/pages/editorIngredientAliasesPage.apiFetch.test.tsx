// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComponentType } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { NotifyProvider } from '../../../../shared/ui/notify'
import { createFetchRecorder, findToast, jsonResponse } from '../../../../test-support/http'

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
    const specifier = './EditorIngredientAliasesPage'
    const mod = (await import(/* @vite-ignore */ specifier)) as {
      EditorIngredientAliasesPage?: ComponentType<object>
    }
    if (typeof mod.EditorIngredientAliasesPage !== 'function') {
      throw new Error('export EditorIngredientAliasesPage ausente')
    }
    return mod.EditorIngredientAliasesPage
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`FN-UI-EDITOR AC-06: EditorIngredientAliasesPage não implementada (${detail}).`)
  }
}

describe('FN-UI-EDITOR AC-06 — colisão de alias', () => {
  beforeEach(() => {
    const recorder = createFetchRecorder((call) => {
      if (call.url.includes('/ingredients/5/aliases') && call.method === 'POST') {
        return jsonResponse(409, { detail: 'Alias já existe' })
      }
      if (call.url.includes('/ingredients/5')) {
        return jsonResponse(200, {
          id: 5,
          name: 'Farinha',
          status: 'approved',
          aliases: [],
        })
      }
      return jsonResponse(404, {})
    })
    vi.stubGlobal('fetch', recorder.fetch)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('RF-UI-ED-09: HTTP 409 ao criar alias exibe toast de erro com mensagem da API', async () => {
    const Page = await loadPage()
    render(
      <NotifyProvider>
        <MemoryRouter initialEntries={['/editor/ingredientes/5/aliases']}>
          <Routes>
            <Route path="/editor/ingredientes/:id/aliases" element={<Page />} />
          </Routes>
        </MemoryRouter>
      </NotifyProvider>,
    )

    await screen.findByText(/alias/i)
    fireEvent.change(screen.getByLabelText(/novo alias/i), { target: { value: 'farinha branca' } })
    fireEvent.click(screen.getByRole('button', { name: /adicionar alias/i }))

    await waitFor(() => {
      const toast = findToast('error')
      expect(toast?.textContent).toMatch(/alias já existe/i)
    })
  })
})