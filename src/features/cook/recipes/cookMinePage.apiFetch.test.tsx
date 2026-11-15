// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NotifyProvider } from '../../../shared/ui/notify'
import { createFetchRecorder, jsonResponse } from '../../../test-support/http'
import { CookRecipesListPage } from './pages/CookRecipesListPage'

vi.mock('../../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

vi.mock('../../auth', () => ({
  useAuth: () => ({
    username: 'chef',
    userId: 42,
    isAuthenticated: true,
    isCook: true,
    isAdmin: false,
    role: 'COOK',
    token: null,
    login: async () => undefined,
    logout: () => undefined,
  }),
}))

describe('página Minhas receitas (AC-07 / RF-UI-API-15)', () => {
  beforeEach(() => {
    const { fetch } = createFetchRecorder((call) => {
      if (call.url.endsWith('/recipes/mine')) {
        return jsonResponse(200, [
          {
            id: 5,
            userId: 42,
            userName: 'chef',
            name: 'Risoto',
            categoryName: 'Massas',
          },
        ])
      }
      return jsonResponse(404, {})
    })
    vi.stubGlobal('fetch', fetch)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('carrega a listagem por GET /recipes/mine', async () => {
    render(
      <MemoryRouter>
        <NotifyProvider>
          <CookRecipesListPage />
        </NotifyProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Risoto')).toBeTruthy()
  })
})
