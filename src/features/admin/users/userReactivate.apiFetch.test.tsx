// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ConfirmProvider } from '../../../shared/ui/confirm'
import { NotifyProvider } from '../../../shared/ui/notify'
import { createFetchRecorder, findToast, jsonResponse, type FetchCall } from '../../../test-support/http'
import { AdminUserProfilePage } from './pages/AdminUserProfilePage'

vi.mock('../../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

type UserBody = {
  id: number
  name: string
  roleName: string
  terminatedAt: string | null
}

describe('reativar usuário (FN-UI-ADMIN-USER-ACCESS)', () => {
  let calls: FetchCall[] = []
  let user: UserBody = {
    id: 4,
    name: 'Inativo',
    roleName: 'COOK',
    terminatedAt: '10/10/2024 10:00:00',
  }

  beforeEach(() => {
    user = {
      id: 4,
      name: 'Inativo',
      roleName: 'COOK',
      terminatedAt: '10/10/2024 10:00:00',
    }
    const recorder = createFetchRecorder((call) => {
      if (call.url.includes('/users/reactivate/')) {
        if (call.method === 'PUT') {
          user = { ...user, terminatedAt: null }
          return jsonResponse(204)
        }
      }
      if (call.url.endsWith('/users/4') || call.url.includes('/users/4')) {
        return jsonResponse(200, {
          id: user.id,
          cpf: null,
          name: user.name,
          roleName: user.roleName,
          salary: null,
          ingressedAt: null,
          terminatedAt: user.terminatedAt,
          fantasyName: null,
        })
      }
      if (call.url.includes('/references') || call.url.includes('/restaurants')) {
        return jsonResponse(200, [])
      }
      return jsonResponse(404, {})
    })
    calls = recorder.calls
    vi.stubGlobal('fetch', recorder.fetch)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  function renderProfile() {
    return render(
      <NotifyProvider>
        <ConfirmProvider>
          <MemoryRouter initialEntries={['/admin/usuarios/4']}>
            <Routes>
              <Route path="/admin/usuarios/:id" element={<AdminUserProfilePage />} />
            </Routes>
          </MemoryRouter>
        </ConfirmProvider>
      </NotifyProvider>,
    )
  }

  function reactivateCalls() {
    return calls.filter((call) => call.url.includes('/users/reactivate/') && call.method === 'PUT')
  }

  it('AC-01: perfil desativado mostra Reativar e não Desativar', async () => {
    renderProfile()
    expect(await screen.findByRole('button', { name: 'Reativar' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Desativar' })).toBeNull()
  })

  it('AC-02: perfil ativo mostra Desativar e não Reativar', async () => {
    user = { id: 4, name: 'Ativo', roleName: 'COOK', terminatedAt: null }
    renderProfile()
    expect(await screen.findByRole('button', { name: 'Desativar' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Reativar' })).toBeNull()
  })

  it('AC-04: cancelar confirmação não chama a API', async () => {
    renderProfile()
    fireEvent.click(await screen.findByRole('button', { name: 'Reativar' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(reactivateCalls()).toHaveLength(0)
  })

  it('AC-03: confirmar Reativar chama PUT /users/reactivate/{id} e UI fica ativa', async () => {
    renderProfile()
    fireEvent.click(await screen.findByRole('button', { name: 'Reativar' }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reativar' }))

    await waitFor(() => {
      expect(reactivateCalls().some((call) => call.url.includes('/users/reactivate/4'))).toBe(true)
    })
    await waitFor(() => {
      expect(findToast('success')).toBeTruthy()
    })
    expect(await screen.findByRole('button', { name: 'Desativar' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Reativar' })).toBeNull()
  })
})
