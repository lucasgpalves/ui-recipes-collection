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

const authMock = vi.fn()

vi.mock('../../../auth', () => ({
  useAuth: () => authMock(),
}))

async function loadPage(): Promise<ComponentType<object>> {
  try {
    const specifier = './EditorEditorialPage'
    const mod = (await import(/* @vite-ignore */ specifier)) as {
      EditorEditorialPage?: ComponentType<object>
    }
    if (typeof mod.EditorEditorialPage !== 'function') {
      throw new Error('export EditorEditorialPage ausente')
    }
    return mod.EditorEditorialPage
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`FN-UI-EDITOR AC-07: EditorEditorialPage não implementada (${detail}).`)
  }
}

describe('FN-UI-EDITOR AC-07 / AC-08 — fila editorial', () => {
  let calls: FetchCall[] = []

  beforeEach(() => {
    authMock.mockReturnValue({
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
    })
    const recorder = createFetchRecorder((call) => {
      if (call.url.includes('/recipes/editorial')) {
        return jsonResponse(200, [{ id: 10, name: 'Bolo', isRated: true, isPublished: false }])
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

  it('RF-UI-ED-11: filtros montam GET /recipes/editorial', async () => {
    const Page = await loadPage()
    render(
      <MemoryRouter>
        <NotifyProvider>
          <Page />
        </NotifyProvider>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/categoria/i), { target: { value: 'Doces' } })
    fireEvent.click(screen.getByLabelText(/somente avaliadas/i))
    fireEvent.click(screen.getByLabelText(/somente publicadas/i))
    fireEvent.change(screen.getByLabelText(/chef/i), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText(/busca/i), { target: { value: 'bolo' } })
    fireEvent.click(screen.getByRole('button', { name: /filtrar/i }))

    await waitFor(() => {
      expect(screen.getByText('Bolo')).toBeTruthy()
    })

    const editorialCalls = calls.filter((c) => c.url.includes('/recipes/editorial'))
    const editorial = editorialCalls[editorialCalls.length - 1]
    expect(editorial?.method).toBe('GET')
    const url = new URL(editorial?.url ?? '', 'http://ui.test')
    expect(url.searchParams.get('category')).toBe('Doces')
    expect(url.searchParams.get('isRated')).toBe('true')
    expect(url.searchParams.get('isPublished')).toBe('true')
    expect(url.searchParams.get('chefName')).toBe('Ana')
    expect(url.searchParams.get('q')).toBe('bolo')
  })

  it('RF-UI-ED-03 / AC-08: ADMIN autenticado pode carregar a fila', async () => {
    authMock.mockReturnValue({
      username: 'admin',
      userId: 1,
      isAuthenticated: true,
      isEditor: false,
      role: 'ADMIN',
      isCook: false,
      isAdmin: true,
      token: null,
      login: async () => undefined,
      logout: () => undefined,
    })

    const Page = await loadPage()
    render(
      <MemoryRouter>
        <NotifyProvider>
          <Page />
        </NotifyProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Bolo')).toBeTruthy()
    expect(calls.some((c) => c.url.includes('/recipes/editorial'))).toBe(true)
  })
})