// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { AuthMeResponse } from '../../shared/api/types'
import {
  TOKEN_KEY,
  createFetchRecorder,
  jsonResponse,
  resetWebStorage,
  type FetchCall,
} from '../../test-support/http'
import { AuthProvider } from './AuthContext'
import { LoginPage } from './pages/Login'

vi.mock('../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

const INVALID_MESSAGE = 'Usuário ou senha inválidos.'

describe('tela de login na API real (AC-01 / AC-04 / RN-UI-AUTH-03 / RN-UI-AUTH-04)', () => {
  let calls: FetchCall[] = []
  let loginStatus = 200
  let role: 'COOK' | 'ADMIN' = 'COOK'
  let cookieSession: AuthMeResponse | null = null

  beforeEach(() => {
    loginStatus = 200
    role = 'COOK'
    cookieSession = null
    resetWebStorage()
    const recorder = createFetchRecorder((call) => {
      if (call.url.includes('/auth/login')) {
        if (loginStatus !== 200) return jsonResponse(loginStatus, {})
        const userId = role === 'ADMIN' ? 7 : 42
        cookieSession = { username: 'chef', role, userId }
        return jsonResponse(200, {
          token: null,
          username: 'chef',
          role,
          userId,
        })
      }
      if (call.url.includes('/auth/me')) {
        if (!cookieSession) return jsonResponse(401, {})
        return jsonResponse(200, cookieSession)
      }
      return jsonResponse(404, {})
    })
    calls = recorder.calls
    vi.stubGlobal('fetch', recorder.fetch)
  })

  afterEach(() => {
    cleanup()
    resetWebStorage()
    vi.unstubAllGlobals()
  })

  function renderLogin() {
    return render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cook/receitas" element={<h1>Painel cook</h1>} />
            <Route path="/admin/usuarios" element={<h1>Painel admin</h1>} />
            <Route path="/" element={<h1>Início</h1>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )
  }

  it.each([401, 403])(
    'AC-04: HTTP %i exibe a mensagem genérica e não grava sessão',
    async (status) => {
      loginStatus = status
      renderLogin()
      fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'chef' } })
      fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'errada' } })
      fireEvent.click(screen.getByRole('button', { name: 'Login' }))

      expect(await screen.findByText(INVALID_MESSAGE)).toBeTruthy()
      expect(screen.queryByText(/Não foi possível entrar/)).toBeNull()
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    },
  )

  it('RN-UI-AUTH-03: username vai sem espaços nas pontas', async () => {
    loginStatus = 401
    renderLogin()
    fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: '  chef  ' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))

    await screen.findByText(INVALID_MESSAGE)
    const login = calls.find((call) => call.url.includes('/auth/login'))
    expect(login?.body).toEqual({ username: 'chef', password: 'secret' })
  })

  it.each([
    ['COOK', 'Painel cook'],
    ['ADMIN', 'Painel admin'],
  ] as const)('AC-01: login %s redireciona para %s sem JWT em sessionStorage', async (nextRole, heading) => {
    role = nextRole
    renderLogin()
    fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'chef' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByRole('heading', { name: heading })).toBeTruthy()
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})
