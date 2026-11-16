// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { apiRequest, setMemoryToken, setUnauthorizedHandler } from '../../shared/api/client'
import type { AuthMeResponse } from '../../shared/api/types'
import { createDemoToken } from '../../shared/auth/tokenClaims'
import {
  TOKEN_KEY,
  createFetchRecorder,
  jsonResponse,
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

describe('sessão cookie HttpOnly na API real (AC-01 / AC-02 / AC-03 / F-05)', () => {
  let cookieSession: AuthMeResponse | null = null
  let recipeStatus = 200
  let calls: FetchCall[] = []

  beforeEach(() => {
    cookieSession = null
    recipeStatus = 200
    resetWebStorage()
    setMemoryToken(null)
    const recorder = createFetchRecorder((call) => {
      if (call.url.includes('/auth/login')) {
        cookieSession = { username: 'chef', role: 'COOK', userId: 42 }
        return jsonResponse(200, {
          token: null,
          username: 'chef',
          role: 'COOK',
          userId: 42,
        })
      }
      if (call.url.includes('/auth/me')) {
        if (!cookieSession) return jsonResponse(401, {})
        return jsonResponse(200, cookieSession)
      }
      if (call.url.includes('/auth/logout')) {
        cookieSession = null
        return new Response(null, { status: 204 })
      }
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

  async function waitForBootUnauthenticated() {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(calls.some((call) => call.url.includes('/auth/me'))).toBe(true)
      expect(screen.getByTestId('authenticated').textContent).toBe('no')
    })
  }

  it('RN-UI-AUTH-08: home por papel', () => {
    expect(homePathForRole('ADMIN')).toBe('/admin/usuarios')
    expect(homePathForRole('COOK')).toBe('/cook/receitas')
    expect(homePathForRole('TASTER')).toBe('/')
    expect(homePathForRole(null)).toBe('/')
  })

  it('AC-01: login sem token no body autentica, não grava JWT e requests usam cookie', async () => {
    await waitForBootUnauthenticated()

    fireEvent.click(screen.getByRole('button', { name: 'entrar' }))

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('yes')
    })
    expect(screen.getByTestId('role').textContent).toBe('COOK')
    expect(screen.getByTestId('username').textContent).toBe('chef')
    expect(screen.getByTestId('userId').textContent).toBe('42')
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()

    const login = calls.find((call) => call.url.includes('/auth/login'))
    expect(login?.credentials).toBe('include')

    await apiRequest('/recipes')
    const recipes = calls.find((call) => call.url.includes('/recipes'))
    expect(recipes?.credentials).toBe('include')
    expect(recipes?.headers.get('authorization')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'sair' }))
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('no')
    })
    expect(calls.some((call) => call.url.includes('/auth/logout') && call.method === 'POST')).toBe(
      true,
    )
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('AC-02: reload restaura a sessão via GET /auth/me', async () => {
    cookieSession = { username: 'chef', role: 'COOK', userId: 42 }
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('yes')
    })
    const me = calls.find((call) => call.url.includes('/auth/me'))
    expect(me?.method).toBe('GET')
    expect(me?.credentials).toBe('include')
    expect(screen.getByTestId('role').textContent).toBe('COOK')
    expect(screen.getByTestId('username').textContent).toBe('chef')
    expect(screen.getByTestId('userId').textContent).toBe('42')
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('AC-02: GET /auth/me 401 deixa a sessão não autenticada', async () => {
    await waitForBootUnauthenticated()
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('RF-UI-API-08: token demo.* residual é limpo no boot da API real', async () => {
    sessionStorage.setItem(TOKEN_KEY, createDemoToken('cook', 'COOK', 1))
    await waitForBootUnauthenticated()

    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    await apiRequest('/recipes').catch(() => undefined)
    const recipes = calls.find((call) => call.url.includes('/recipes'))
    expect(recipes?.headers.get('authorization') ?? '').not.toMatch(/^Bearer demo\./)
  })

  it('AC-03: HTTP 401 limpa o estado de auth (e TOKEN_KEY residual)', async () => {
    cookieSession = { username: 'chef', role: 'COOK', userId: 42 }
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('yes')
    })

    recipeStatus = 401
    await expect(apiRequest('/recipes')).rejects.toMatchObject({ status: 401 })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('no')
    })
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('AC-12 gap: HTTP 403 não limpa a sessão (client só chama onUnauthorized em 401)', async () => {
    cookieSession = { username: 'chef', role: 'COOK', userId: 42 }
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('yes')
    })

    recipeStatus = 403
    await expect(apiRequest('/recipes')).rejects.toMatchObject({ status: 403 })

    expect(screen.getByTestId('authenticated').textContent).toBe('yes')
    expect(screen.getByTestId('role').textContent).toBe('COOK')
  })
})
