// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import styles from './AdminLayout.module.css'

vi.mock('../../features/auth', () => ({
  useAuth: () => ({
    username: 'admin',
    userId: 7,
    isAuthenticated: true,
    isCook: false,
    isAdmin: true,
    role: 'ADMIN',
    token: null,
    login: async () => undefined,
    logout: () => undefined,
  }),
}))

const OBJECT_ITEMS = [
  { label: 'Usuários', listHref: '/admin/usuarios' },
  { label: 'Categorias', listHref: '/admin/categorias' },
  { label: 'Papéis', listHref: '/admin/papeis' },
  { label: 'Metas', listHref: '/admin/metas' },
  { label: 'Restaurantes', listHref: '/admin/restaurantes' },
] as const

function renderAdminAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="usuarios" element={<div>usuarios</div>} />
          <Route path="usuarios/novo" element={<div>usuario-novo</div>} />
          <Route path="usuarios/:id" element={<div>usuario-perfil</div>} />
          <Route path="usuarios/:id/editar" element={<div>usuario-editar</div>} />
          <Route path="usuarios/:id/credenciais" element={<div>usuario-credenciais</div>} />
          <Route path="usuarios/:id/referencias/nova" element={<div>usuario-ref-nova</div>} />
          <Route path="categorias" element={<div>categorias</div>} />
          <Route path="categorias/nova" element={<div>categoria-nova</div>} />
          <Route path="categorias/:id/editar" element={<div>categoria-editar</div>} />
          <Route path="papeis" element={<div>papeis</div>} />
          <Route path="papeis/novo" element={<div>papel-novo</div>} />
          <Route path="papeis/:id/editar" element={<div>papel-editar</div>} />
          <Route path="metas" element={<div>metas</div>} />
          <Route path="metas/nova" element={<div>meta-nova</div>} />
          <Route path="metas/:id/editar" element={<div>meta-editar</div>} />
          <Route path="restaurantes" element={<div>restaurantes</div>} />
          <Route path="restaurantes/novo" element={<div>restaurante-novo</div>} />
          <Route path="restaurantes/:id/editar" element={<div>restaurante-editar</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function sidebar() {
  return screen.getByRole('complementary')
}

describe('AdminLayout sidebar — FN-UI-NAV-SIDEBAR-OBJECT', () => {
  afterEach(() => {
    cleanup()
  })

  it('AC-UI-NAV-02: um item por domínio; sem Listagem nem Cadastro', () => {
    renderAdminAt('/admin/usuarios')

    const nav = within(sidebar())
    for (const { label } of OBJECT_ITEMS) {
      expect(nav.getByRole('link', { name: label })).toBeTruthy()
    }
    expect(nav.queryByRole('link', { name: 'Listagem' })).toBeNull()
    expect(nav.queryByRole('link', { name: 'Cadastro' })).toBeNull()
  })

  it.each(OBJECT_ITEMS)(
    'AC-UI-NAV-03: item $label aponta para $listHref',
    ({ label, listHref }) => {
      renderAdminAt('/admin/usuarios')

      const link = within(sidebar()).getByRole('link', { name: label })
      expect(link.getAttribute('href')).toBe(listHref)
    },
  )

  it.each([
    { path: '/admin/usuarios/novo', label: 'Usuários' },
    { path: '/admin/usuarios/3', label: 'Usuários' },
    { path: '/admin/usuarios/3/editar', label: 'Usuários' },
    { path: '/admin/usuarios/3/credenciais', label: 'Usuários' },
    { path: '/admin/usuarios/3/referencias/nova', label: 'Usuários' },
    { path: '/admin/categorias/nova', label: 'Categorias' },
    { path: '/admin/categorias/2/editar', label: 'Categorias' },
    { path: '/admin/papeis/novo', label: 'Papéis' },
    { path: '/admin/papeis/4/editar', label: 'Papéis' },
    { path: '/admin/metas/nova', label: 'Metas' },
    { path: '/admin/metas/5/editar', label: 'Metas' },
    { path: '/admin/restaurantes/novo', label: 'Restaurantes' },
    { path: '/admin/restaurantes/6/editar', label: 'Restaurantes' },
  ])('AC-UI-NAV-05: $label permanece ativo em $path', ({ path, label }) => {
    renderAdminAt(path)

    const link = within(sidebar()).getByRole('link', { name: label })
    expect(link.className.split(/\s+/)).toContain(styles.navActive)
  })
})
