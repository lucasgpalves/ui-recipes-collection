// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { apiRequest, setMemoryToken, setUnauthorizedHandler } from '../../shared/api/client'
import { createDemoToken } from '../../shared/auth/tokenClaims'
import {
  TOKEN_KEY,
  createFetchRecorder,
  jsonResponse,
  jwtWithClaims,
  resetWebStorage,
  type FetchCall,
} from '../../test-support/http'
import { AuthProvider, homePathForRole, useAuth } from './AuthContext'

vi.mock('../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

function Probe() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="authenticated">{auth.isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="role">{auth.role ?? ''}</span>
      <span data-testid="username">{auth.username ?? ''}</span>
      <span data-testid="userId">{auth.userId ?? ''}</span>
      <button type="button" onClick={() => void auth.login('chef', 'secret')}>
        entrar
      </button>
      <button type="button" onClick={() => auth.logout()}>
        sair
      </button>
    </div>
  )
}

describe('sessão JWT em sessionStorage (AC-01 / AC-02 / AC-03 / AC-12)', () => {
  let token = ''
  let recipeStatus = 200
  let calls: FetchCall[] = []

  beforeEach(() => {
    token = jwtWithClaims({ sub: 'chef', role: 'COOK', userId: 42 })
    recipeStatus = 200
    resetWebStorage()
    setMemoryToken(null)
    const recorder = createFetchRecorder((call) => {
      if (call.url.includes('/auth/login')) {
        return jsonResponse(200, { token, username: 'chef', role: 'COOK', userId: 42 })
      }
      if (call.url.includes('/auth/me')) return jsonResponse(404, {})
      if (call.url.includes('/auth/logout')) return new Response(null, { status: 204 })
      if (call.url.includes('/recipes')) return jsonResponse(recipeStatus, [])
      return jsonResponse(404, {})
    })
    calls = recorder.calls
    vi.stubGlobal('fetch', recorder.fetch)
  })

  afterEach(() => {
    cleanup()
    setUnauthorizedHandler(null)
    setMemoryToken(null)
    resetWebStorage()
    vi.unstubAllGlobals()
  })

  it('RN-UI-AUTH-08: home por papel', () => {
    expect(homePathForRole('ADMIN')).toBe('/admin/usuarios')
    expect(homePathForRole('COOK')).toBe('/cook/receitas')
    expect(homePathForRole('TASTER')).toBe('/')
    expect(homePathForRole(null)).toBe('/')
  })

  it('AC-01 / RF-UI-API-05 / RF-UI-API-07: login grava o JWT, request seguinte usa Bearer e logout apaga', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'entrar' }))

    await waitFor(() => {
      expect(sessionStorage.getItem(TOKEN_KEY)).toBe(token)
      expect(screen.getByTestId('authenticated').textContent).toBe('yes')
    })
    expect(screen.getByTestId('role').textContent).toBe('COOK')
    expect(screen.getByTestId('username').textContent).toBe('chef')
    expect(screen.getByTestId('userId').textContent).toBe('42')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(sessionStorage.getItem(TOKEN_KEY)).not.toBe('cookie-session')

    await apiRequest('/recipes')
    const recipes = calls.find((call) => call.url.includes('/recipes'))
    expect(recipes?.headers.get('authorization')).toBe(`Bearer ${token}`)

    fireEvent.click(screen.getByRole('button', { name: 'sair' }))
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('no')
    })
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('AC-02: reload restaura a sessão a partir do sessionStorage', async () => {
    sessionStorage.setItem(TOKEN_KEY, token)
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('yes')
    })
    expect(screen.getByTestId('role').textContent).toBe('COOK')
    expect(screen.getByTestId('username').textContent).toBe('chef')
    expect(screen.getByTestId('userId').textContent).toBe('42')
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe(token)
  })

  it('AC-02: token ausente deixa a sessão não autenticada', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('no')
    })
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('AC-02: token expirado limpa a sessão', async () => {
    sessionStorage.setItem(
      TOKEN_KEY,
      jwtWithClaims({
        sub: 'chef',
        role: 'COOK',
        userId: 42,
        exp: Math.floor(Date.now() / 1000) - 30,
      }),
    )
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('no')
    })
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('AC-02 / RF-UI-API-06: token inválido limpa a sessão', async () => {
    sessionStorage.setItem(TOKEN_KEY, 'not-a-jwt')
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('no')
    })
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('RF-UI-API-06: boot não chama GET /auth/me nem grava cookie-session', async () => {
    sessionStorage.setItem(TOKEN_KEY, token)
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('yes')
    })
    expect(calls.some((call) => call.url.includes('/auth/me'))).toBe(false)
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe(token)
    expect(sessionStorage.getItem(TOKEN_KEY)).not.toBe('cookie-session')
    expect(screen.getByTestId('role').textContent).toBe('COOK')
  })

  it('RF-UI-API-08: token demo.* é rejeitado na API real', async () => {
    sessionStorage.setItem(TOKEN_KEY, createDemoToken('cook', 'COOK', 1))
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('no')
    })
    await apiRequest('/recipes').catch(() => undefined)
    const recipes = calls.find((call) => call.url.includes('/recipes'))
    expect(recipes?.headers.get('authorization') ?? '').not.toMatch(/^Bearer demo\./)
  })

  it.each([401, 403])('AC-03 / AC-12: HTTP %i limpa sessionStorage e o estado de auth', async (status) => {
    sessionStorage.setItem(TOKEN_KEY, token)
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('yes')
    })

    recipeStatus = status
    await expect(apiRequest('/recipes')).rejects.toMatchObject({ status })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('no')
    })
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})
