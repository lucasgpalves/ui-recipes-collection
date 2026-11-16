// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ComponentType } from 'react'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '../../shared/theme'
import styles from './AdminLayout.module.css'

vi.mock('../../features/auth', () => ({
  useAuth: () => ({
    username: 'editor',
    userId: 12,
    isAuthenticated: true,
    isCook: false,
    isAdmin: false,
    isEditor: true,
    role: 'EDITOR',
    token: null,
    login: async () => undefined,
    logout: vi.fn(),
  }),
}))

const OBJECT_ITEMS = [
  { label: 'Ingredientes', listHref: '/editor/ingredientes' },
  { label: 'Livros', listHref: '/editor/livros' },
  { label: 'Receitas', listHref: '/editor/receitas' },
] as const

async function loadEditorLayout(): Promise<ComponentType<object>> {
  try {
    const specifier = './EditorLayout'
    const mod = (await import(/* @vite-ignore */ specifier)) as { EditorLayout?: ComponentType<object> }
    if (typeof mod.EditorLayout !== 'function') {
      throw new Error('export nomeado EditorLayout ausente')
    }
    return mod.EditorLayout
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`FN-UI-EDITOR AC-03: EditorLayout ainda não implementado (${detail}).`)
  }
}

function renderEditorAt(path: string, Layout: ComponentType<object>) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/editor" element={<Layout />}>
            <Route path="ingredientes" element={<div>ingredientes</div>} />
            <Route path="ingredientes/:id/aliases" element={<div>aliases</div>} />
            <Route path="ingredientes/merge" element={<div>merge</div>} />
            <Route path="livros" element={<div>livros</div>} />
            <Route path="livros/novo" element={<div>livro-novo</div>} />
            <Route path="livros/:id" element={<div>livro-detalhe</div>} />
            <Route path="receitas" element={<div>receitas</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

function sidebar() {
  return screen.getByRole('complementary')
}

describe('EditorLayout sidebar — FN-UI-EDITOR AC-03 / RF-UI-ED-05', () => {
  afterEach(() => {
    cleanup()
  })

  it('AC-03: um item por objeto; sem Listagem nem Cadastro', async () => {
    const Layout = await loadEditorLayout()
    renderEditorAt('/editor/ingredientes', Layout)

    const nav = within(sidebar())
    for (const { label } of OBJECT_ITEMS) {
      expect(nav.getByRole('link', { name: label })).toBeTruthy()
    }
    expect(nav.queryByRole('link', { name: 'Listagem' })).toBeNull()
    expect(nav.queryByRole('link', { name: 'Cadastro' })).toBeNull()
  })

  it.each(OBJECT_ITEMS)(
    'RF-UI-ED-05: item $label aponta para $listHref',
    async ({ label, listHref }) => {
      const Layout = await loadEditorLayout()
      renderEditorAt('/editor/ingredientes', Layout)

      const link = within(sidebar()).getByRole('link', { name: label })
      expect(link.getAttribute('href')).toBe(listHref)
    },
  )

  it.each([
    { path: '/editor/ingredientes/5/aliases', label: 'Ingredientes' },
    { path: '/editor/ingredientes/merge', label: 'Ingredientes' },
    { path: '/editor/livros/novo', label: 'Livros' },
    { path: '/editor/livros/3', label: 'Livros' },
    { path: '/editor/receitas', label: 'Receitas' },
  ])('RNF-UI-ED-02: $label permanece ativo em $path', async ({ path, label }) => {
    const Layout = await loadEditorLayout()
    renderEditorAt(path, Layout)

    const link = within(sidebar()).getByRole('link', { name: label })
    expect(link.className.split(/\s+/)).toContain(styles.navActive)
  })

  it('RF-UI-ED-18: mostra Ver site e Sair', async () => {
    const Layout = await loadEditorLayout()
    renderEditorAt('/editor/ingredientes', Layout)

    const aside = within(sidebar())
    expect(aside.getByRole('link', { name: 'Ver site' }).getAttribute('href')).toBe('/')
    expect(aside.getByRole('button', { name: 'Sair' })).toBeTruthy()
  })
})