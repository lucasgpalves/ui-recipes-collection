// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '../../shared/theme'
import { CookLayout } from './CookLayout'
import styles from './AdminLayout.module.css'

vi.mock('../../features/auth', () => ({
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

function renderCookAt(path: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/cook" element={<CookLayout />}>
            <Route path="receitas" element={<div>listagem</div>} />
            <Route path="receitas/nova" element={<div>nova</div>} />
            <Route path="receitas/:id/editar" element={<div>editar</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

function sidebar() {
  return screen.getByRole('complementary')
}

describe('CookLayout sidebar — FN-UI-NAV-SIDEBAR-OBJECT', () => {
  afterEach(() => {
    cleanup()
  })

  it('AC-UI-NAV-01: mostra item Receitas e não mostra Listagem nem Cadastro', () => {
    renderCookAt('/cook/receitas')

    const nav = within(sidebar())
    expect(nav.getByRole('link', { name: 'Receitas' })).toBeTruthy()
    expect(nav.queryByRole('link', { name: 'Listagem' })).toBeNull()
    expect(nav.queryByRole('link', { name: 'Cadastro' })).toBeNull()
  })

  it('AC-UI-NAV-03: item Receitas aponta para /cook/receitas', () => {
    renderCookAt('/cook/receitas')

    const receitas = within(sidebar()).getByRole('link', { name: 'Receitas' })
    expect(receitas.getAttribute('href')).toBe('/cook/receitas')
  })

  it.each([
    '/cook/receitas/nova',
    '/cook/receitas/12/editar',
  ])('AC-UI-NAV-04: Receitas permanece ativo em %s', (path) => {
    renderCookAt(path)

    const receitas = within(sidebar()).getByRole('link', { name: 'Receitas' })
    expect(receitas.className.split(/\s+/)).toContain(styles.navActive)
  })
})
