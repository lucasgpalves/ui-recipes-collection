// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PublicLayout } from '../../app/layout/PublicLayout'
import { HomePage } from '../../app/pages/Home'
import { NotifyProvider } from '../../shared/ui/notify'
import {
  createFetchRecorder,
  findToast,
  jsonResponse,
  resetWebStorage,
  type FetchCall,
} from '../../test-support/http'
import { AuthProvider } from '../auth'
import { RecipeDetailPage } from './pages/RecipeDetail'
import { SearchResultsPage } from './pages/SearchResults'

vi.mock('../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

const summary = {
  id: 3,
  userId: 9,
  userName: 'Ana',
  name: 'Pudim',
  categoryName: 'Doces',
  description: null,
  imageUrl: null,
  isPublished: true,
}

const detail = {
  id: 3,
  userId: 9,
  userName: 'Ana',
  name: 'Pudim',
  categoryName: 'Doces',
  createdAt: null,
  preparationMethod: 'Assar',
  portions: 4,
  ingredients: [],
  description: null,
  isPublished: true,
  isRated: false,
}

describe('área pública na API real (AC-05 / AC-06 / RF-UI-API-01 / RF-UI-API-14)', () => {
  const state: { calls: FetchCall[]; recipesFail: boolean } = { calls: [], recipesFail: false }

  beforeEach(() => {
    state.recipesFail = false
    resetWebStorage()
    const recorder = createFetchRecorder((call) => {
      if (call.url.includes('/auth/me')) return jsonResponse(401, {})
      if (call.url.endsWith('/categories')) {
        return jsonResponse(200, [{ id: 1, name: 'Doces', description: null }])
      }
      if (/\/recipes$/.test(call.url)) {
        return state.recipesFail ? jsonResponse(500, {}) : jsonResponse(200, [summary])
      }
      if (call.url.endsWith('/recipes/3')) return jsonResponse(200, detail)
      if (call.url.endsWith('/reviews')) return jsonResponse(200, [])
      return jsonResponse(404, {})
    })
    state.calls = recorder.calls
    vi.stubGlobal('fetch', recorder.fetch)
  })

  afterEach(() => {
    cleanup()
    resetWebStorage()
    vi.unstubAllGlobals()
  })

  function callsTo(suffix: string) {
    return state.calls.filter((call) => call.url.endsWith(suffix))
  }

  it('home e categorias carregam por HTTP sem token', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/acervo público/i)
    await waitFor(() => {
      expect(callsTo('/categories')).toHaveLength(1)
    })
    expect(callsTo('/categories')[0]?.headers.get('authorization')).toBeNull()
  })

  it('busca lista receitas por HTTP sem token', async () => {
    render(
      <MemoryRouter initialEntries={['/receitas?q=pudim']}>
        <Routes>
          <Route path="/receitas" element={<SearchResultsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: 'Ver receita Pudim' })).toBeTruthy()
    expect(callsTo('/recipes')).toHaveLength(1)
    expect(callsTo('/recipes')[0]?.headers.get('authorization')).toBeNull()
  })

  it('detalhe carrega a receita sem token e mostra o PDF fora do demo', async () => {
    render(
      <MemoryRouter initialEntries={['/receitas/3']}>
        <Routes>
          <Route path="/receitas/:id" element={<RecipeDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Pudim' })).toBeTruthy()
    const pdf = screen.getByRole('link', { name: 'Baixar PDF' })
    expect(pdf.getAttribute('href')).toBe('/api/recipes/3/download')
    expect(callsTo('/recipes/3')[0]?.headers.get('authorization')).toBeNull()
    expect(callsTo('/reviews')[0]?.headers.get('authorization')).toBeNull()
  })

  it('RF-UI-API-13: falha ao carregar a busca gera toast error', async () => {
    state.recipesFail = true
    render(
      <MemoryRouter initialEntries={['/receitas']}>
        <NotifyProvider>
          <Routes>
            <Route path="/receitas" element={<SearchResultsPage />} />
          </Routes>
        </NotifyProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(findToast('error')).toBeTruthy()
    })
  })
})
