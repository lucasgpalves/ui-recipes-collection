import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFetchRecorder, installMemoryStorage, jsonResponse } from '../../../../test-support/http'
import { createBook, fetchBookById, fetchEditorBooks, publishBook } from './books'

vi.mock('../../../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

describe('FN-UI-EDITOR — books API (RF-UI-ED-13 / RF-UI-ED-14)', () => {
  beforeEach(() => {
    installMemoryStorage('sessionStorage')
    installMemoryStorage('localStorage')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('GET /books lista livros', async () => {
    const { calls, fetch } = createFetchRecorder(() =>
      jsonResponse(200, [{ id: 1, title: 'Livro', isPublished: false, recipesId: [2] }]),
    )
    vi.stubGlobal('fetch', fetch)

    await fetchEditorBooks()

    expect(calls[0]?.url).toBe('/api/books')
    expect(calls[0]?.method).toBe('GET')
  })

  it('GET /books/{id} detalhe', async () => {
    const { calls, fetch } = createFetchRecorder(() =>
      jsonResponse(200, { id: 3, title: 'Livro', isPublished: false, recipesId: [2] }),
    )
    vi.stubGlobal('fetch', fetch)

    await fetchBookById(3)

    expect(calls[0]?.url).toBe('/api/books/3')
    expect(calls[0]?.method).toBe('GET')
  })

  it('RF-UI-ED-13: POST /books create', async () => {
    const body = {
      title: 'Novo',
      isbn: '123',
      description: 'Desc',
      recipesId: [5, 6],
    }
    const { calls, fetch } = createFetchRecorder(() => jsonResponse(201, { id: 8, ...body, isPublished: false }))
    vi.stubGlobal('fetch', fetch)

    await createBook(body)

    expect(calls[0]?.url).toBe('/api/books')
    expect(calls[0]?.method).toBe('POST')
    expect(calls[0]?.body).toEqual(body)
  })

  it('RF-UI-ED-14: PATCH /books/{id} publish', async () => {
    const { calls, fetch } = createFetchRecorder(() => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)

    await publishBook(7)

    expect(calls[0]?.url).toBe('/api/books/7')
    expect(calls[0]?.method).toBe('PATCH')
  })
})