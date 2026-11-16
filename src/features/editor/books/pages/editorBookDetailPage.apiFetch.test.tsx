// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComponentType } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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
    const specifier = './EditorBookDetailPage'
    const mod = (await import(/* @vite-ignore */ specifier)) as {
      EditorBookDetailPage?: ComponentType<object>
    }
    if (typeof mod.EditorBookDetailPage !== 'function') {
      throw new Error('export EditorBookDetailPage ausente')
    }
    return mod.EditorBookDetailPage
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`FN-UI-EDITOR AC-09: EditorBookDetailPage não implementada (${detail}).`)
  }
}

describe('FN-UI-EDITOR AC-09 / AC-10 — livro publish', () => {
  let calls: FetchCall[] = []
  let published = false
  let publishStatus = 204

  beforeEach(() => {
    published = false
    publishStatus = 204
    const recorder = createFetchRecorder((call) => {
      if (call.url.endsWith('/books/4') && call.method === 'GET') {
        return jsonResponse(200, {
          id: 4,
          title: 'Livro teste',
          isbn: '123',
          description: 'Desc',
          isPublished: published,
          recipesId: [10],
        })
      }
      if (call.url.endsWith('/books/4') && call.method === 'PATCH') {
        if (publishStatus === 204) {
          published = true
          return new Response(null, { status: 204 })
        }
        return jsonResponse(publishStatus, { detail: 'ISBN inválido; receita sem review' })
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
      <NotifyProvider>
        <MemoryRouter initialEntries={['/editor/livros/4']}>
          <Routes>
            <Route path="/editor/livros/:id" element={<Page />} />
          </Routes>
        </MemoryRouter>
      </NotifyProvider>,
    )
  }

  it('RF-UI-ED-14: publicar com sucesso marca UI como publicado', async () => {
    await renderPage()
    await screen.findByText('Livro teste')

    fireEvent.click(screen.getByRole('button', { name: /publicar/i }))

    await waitFor(() => {
      expect(screen.getByText(/publicado/i)).toBeTruthy()
    })
    expect(findToast('success')).toBeTruthy()
    expect(calls.some((c) => c.url.endsWith('/books/4') && c.method === 'PATCH')).toBe(true)
  })

  it('RF-UI-ED-15: falha de publish mostra feedback da API', async () => {
    publishStatus = 422
    await renderPage()
    await screen.findByText('Livro teste')

    fireEvent.click(screen.getByRole('button', { name: /publicar/i }))

    await waitFor(() => {
      expect(screen.getByText(/ISBN inválido/i)).toBeTruthy()
    })
    expect(findToast('error')).toBeTruthy()
  })

  it('RF-UI-ED-16 / AC-10: livro publicado não oferece unpublish', async () => {
    published = true
    await renderPage()
    await screen.findByText('Livro teste')

    expect(screen.queryByRole('button', { name: /despublicar|unpublish/i })).toBeNull()
  })
})