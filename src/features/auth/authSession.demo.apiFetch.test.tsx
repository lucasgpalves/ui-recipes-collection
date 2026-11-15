// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TOKEN_KEY, resetWebStorage } from '../../test-support/http'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: true,
  },
}))

function Probe() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="authenticated">{auth.isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="role">{auth.role ?? ''}</span>
      <span data-testid="userId">{auth.userId ?? ''}</span>
      <button type="button" onClick={() => void auth.login('cook', 'cook')}>
        entrar
      </button>
      <button type="button" onClick={() => auth.logout()}>
        sair
      </button>
    </div>
  )
}

describe('sessão demo (RF-UI-API-08)', () => {
  let urls: string[] = []

  beforeEach(() => {
    urls = []
    resetWebStorage()
    vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
      urls.push(String(input))
      return Promise.resolve(new Response('{}', { status: 500 }))
    })
  })

  afterEach(() => {
    cleanup()
    resetWebStorage()
    vi.unstubAllGlobals()
  })

  it('login grava token demo no sessionStorage e o reload restaura', async () => {
    const first = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'entrar' }))

    await waitFor(() => {
      expect(sessionStorage.getItem(TOKEN_KEY)).toMatch(/^demo\./)
      expect(screen.getByTestId('role').textContent).toBe('COOK')
      expect(screen.getByTestId('userId').textContent).toBe('1')
    })
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(urls.some((url) => url.includes('/auth/login'))).toBe(false)

    first.unmount()
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('yes')
      expect(screen.getByTestId('role').textContent).toBe('COOK')
    })
  })

  it('logout remove o token demo do sessionStorage', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'entrar' }))
    await waitFor(() => {
      expect(sessionStorage.getItem(TOKEN_KEY)).toMatch(/^demo\./)
    })

    fireEvent.click(screen.getByRole('button', { name: 'sair' }))
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('no')
    })
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})
