// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireEditor } from './RequireEditor'
import { RequireEditorOrAdmin } from './RequireEditorOrAdmin'

const useAuth = vi.fn()

vi.mock('../auth', () => ({
  useAuth: () => useAuth(),
}))

function authState(
  overrides: Partial<{
    isAuthenticated: boolean
    role: string | null
    isEditor: boolean
    isAdmin: boolean
    isCook: boolean
  }> = {},
) {
  const role = overrides.role ?? null
  return {
    username: role ? 'user' : null,
    userId: role ? 1 : null,
    token: null,
    isAuthenticated: overrides.isAuthenticated ?? Boolean(role),
    role,
    isCook: overrides.isCook ?? role === 'COOK',
    isAdmin: overrides.isAdmin ?? role === 'ADMIN',
    isEditor: overrides.isEditor ?? role === 'EDITOR',
    login: async () => undefined,
    logout: () => undefined,
    ...overrides,
  }
}

describe('FN-UI-EDITOR — guards (AC-02 / RF-UI-ED-02 / RF-UI-ED-03)', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  function renderRequireEditor(entry: string) {
    return render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/login" element={<h1>Login</h1>} />
          <Route path="/" element={<h1>Home</h1>} />
          <Route path="/editor" element={<RequireEditor />}>
            <Route path="ingredientes" element={<h1>Editor shell</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
  }

  function renderRequireEditorOrAdmin(entry: string) {
    return render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/login" element={<h1>Login</h1>} />
          <Route path="/" element={<h1>Home</h1>} />
          <Route path="/editor" element={<RequireEditorOrAdmin />}>
            <Route path="receitas" element={<h1>Fila editorial</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
  }

  it('AC-02: anônimo em RequireEditor redireciona para /login', () => {
    useAuth.mockReturnValue(authState({ isAuthenticated: false, role: null }))
    renderRequireEditor('/editor/ingredientes')
    expect(screen.getByRole('heading', { name: 'Login' })).toBeTruthy()
  })

  it('AC-02: COOK em RequireEditor redireciona para /', () => {
    useAuth.mockReturnValue(authState({ role: 'COOK' }))
    renderRequireEditor('/editor/ingredientes')
    expect(screen.getByRole('heading', { name: 'Home' })).toBeTruthy()
  })

  it('AC-02: TASTER em RequireEditor redireciona para /', () => {
    useAuth.mockReturnValue(authState({ role: 'TASTER' }))
    renderRequireEditor('/editor/ingredientes')
    expect(screen.getByRole('heading', { name: 'Home' })).toBeTruthy()
  })

  it('AC-02: EDITOR em RequireEditor renderiza o outlet', () => {
    useAuth.mockReturnValue(authState({ role: 'EDITOR' }))
    renderRequireEditor('/editor/ingredientes')
    expect(screen.getByRole('heading', { name: 'Editor shell' })).toBeTruthy()
  })

  it('AC-02: ADMIN em RequireEditor redireciona para /', () => {
    useAuth.mockReturnValue(authState({ role: 'ADMIN' }))
    renderRequireEditor('/editor/ingredientes')
    expect(screen.getByRole('heading', { name: 'Home' })).toBeTruthy()
  })

  it('RF-UI-ED-03: RequireEditorOrAdmin permite EDITOR na fila editorial', () => {
    useAuth.mockReturnValue(authState({ role: 'EDITOR' }))
    renderRequireEditorOrAdmin('/editor/receitas')
    expect(screen.getByRole('heading', { name: 'Fila editorial' })).toBeTruthy()
  })

  it('RF-UI-ED-03 / AC-08: RequireEditorOrAdmin permite ADMIN na fila editorial', () => {
    useAuth.mockReturnValue(authState({ role: 'ADMIN' }))
    renderRequireEditorOrAdmin('/editor/receitas')
    expect(screen.getByRole('heading', { name: 'Fila editorial' })).toBeTruthy()
  })

  it('RF-UI-ED-03: RequireEditorOrAdmin bloqueia COOK', () => {
    useAuth.mockReturnValue(authState({ role: 'COOK' }))
    renderRequireEditorOrAdmin('/editor/receitas')
    expect(screen.getByRole('heading', { name: 'Home' })).toBeTruthy()
  })
})