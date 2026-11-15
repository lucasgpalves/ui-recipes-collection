// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NotifyProvider } from '../../../shared/ui/notify'
import { findToast } from '../../../test-support/http'
import { RecipeForm } from './components/RecipeForm'

const session = vi.hoisted(() => ({ userId: 42 as number | null }))

vi.mock('../../auth', () => ({
  useAuth: () => ({
    username: 'chef',
    userId: session.userId,
    isAuthenticated: true,
    isCook: true,
    isAdmin: false,
    role: 'COOK',
    token: null,
    login: async () => undefined,
    logout: () => undefined,
  }),
}))

vi.mock('../../catalog', () => ({
  fetchCategories: async () => [{ id: 1, name: 'Massas', description: null }],
}))

async function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Risoto' } })
  fireEvent.change(screen.getByLabelText('Método de preparo'), { target: { value: 'Mexer sempre' } })
  await screen.findByRole('option', { name: 'Massas' })
  fireEvent.change(screen.getByLabelText('Nome do ingrediente'), { target: { value: 'arroz' } })
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar à lista' }))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
}

describe('userId da sessão no formulário de receita (RF-UI-API-16)', () => {
  afterEach(() => {
    cleanup()
    session.userId = 42
  })

  it('envia o userId autenticado no payload', async () => {
    const onSubmit = vi.fn(async () => undefined)
    render(
      <NotifyProvider>
        <RecipeForm submitLabel="Salvar" onSubmit={onSubmit} />
      </NotifyProvider>,
    )

    await fillAndSubmit()

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, name: 'Risoto' }))
    })
  })

  it('bloqueia com warning quando userId da sessão é null', async () => {
    session.userId = null
    const onSubmit = vi.fn(async () => undefined)
    render(
      <NotifyProvider>
        <RecipeForm submitLabel="Salvar" onSubmit={onSubmit} />
      </NotifyProvider>,
    )

    await fillAndSubmit()

    expect((await screen.findAllByText(/Sessão sem userId/)).length).toBeGreaterThan(0)
    expect(findToast('warning')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
