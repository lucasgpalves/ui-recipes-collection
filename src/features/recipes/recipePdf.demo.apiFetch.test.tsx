// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RecipeDetailPage } from './pages/RecipeDetail'

vi.mock('../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: true,
  },
}))

vi.mock('./api/recipes', () => ({
  fetchRecipe: async () => ({
    id: 3,
    userName: 'Ana',
    name: 'Pudim',
    categoryName: 'Doces',
    createdAt: null,
    preparationMethod: null,
    portions: null,
    ingredients: [],
    description: null,
    isPublished: null,
    isRated: null,
  }),
  fetchReviews: async () => [],
}))

describe('PDF no demo (AC-06 / RN-UI-PUB-05)', () => {
  afterEach(() => {
    cleanup()
  })

  it('oculta o link de download quando VITE_USE_DEMO_API está ativo', async () => {
    render(
      <MemoryRouter initialEntries={['/receitas/3']}>
        <Routes>
          <Route path="/receitas/:id" element={<RecipeDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Pudim' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Baixar PDF' })).toBeNull()
  })
})
