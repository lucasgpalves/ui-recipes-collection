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
    const specifier = './EditorBookCreatePage'
    const mod = (await import(/* @vite-ignore */ specifier)) as {
      EditorBookCreatePage?: ComponentType<object>
    }
    if (typeof mod.EditorBookCreatePage !== 'function') {
      throw new Error('export EditorBookCreatePage ausente')
    }
    return mod.EditorBookCreatePage
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`FN-UI-EDITOR AC-09: EditorBookCreatePage não implementada (${detail}).`)
  }
}

describe('FN-UI-EDITOR AC-09 — create livro', () => {
  let calls: FetchCall[] = []

  beforeEach(() => {
    const recorder = createFetchRecorder((call) => {
      if (call.url.endsWith('/books') && call.method === 'POST') {
        return jsonResponse(201, { id: 9, title: 'Novo', isPublished: false, recipesId: [2] })
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

  it('RF-UI-ED-13: submit envia POST /books', async () => {
    const Page = await loadPage()
    render(
      <MemoryRouter>
        <NotifyProvider>
          <Page />
        </NotifyProvider>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Novo' } })
    fireEvent.change(screen.getByLabelText(/isbn/i), { target: { value: '978-3-16-148410-0' } })
    fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: 'Desc' } })
    fireEvent.change(screen.getByLabelText(/receitas/i), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: /criar livro|salvar/i }))

    await waitFor(() => {
      expect(calls.some((c) => c.url.endsWith('/books') && c.method === 'POST')).toBe(true)
    })

    const create = calls.find((c) => c.url.endsWith('/books') && c.method === 'POST')
    expect(create?.body).toMatchObject({
      title: 'Novo',
      isbn: '978-3-16-148410-0',
      description: 'Desc',
      recipesId: [2],
    })
  })
})