// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { NotifyProvider } from '../../../shared/ui/notify'
import { createFetchRecorder, findToast, jsonResponse, type FetchCall } from '../../../test-support/http'
import { AdminUserCredentialsPage } from './pages/AdminUserCredentialsPage'

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

describe('credenciais POST /auth/register (AC-10 / RF-UI-API-17…19)', () => {
  let calls: FetchCall[] = []
  let registerStatus = 201
  let user: UserBody = { id: 9, name: 'Ana', roleName: 'COOK', terminatedAt: null }

  beforeEach(() => {
    registerStatus = 201
    user = { id: 9, name: 'Ana', roleName: 'COOK', terminatedAt: null }
    const recorder = createFetchRecorder((call) => {
      if (call.url.endsWith('/users/9') || call.url.endsWith('/users/4')) {
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
      if (call.url.includes('/auth/register')) {
        return registerStatus === 201 ? jsonResponse(201) : jsonResponse(registerStatus, {})
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

  function renderPage(userId = 9) {
    return render(
      <NotifyProvider>
        <MemoryRouter initialEntries={[`/admin/usuarios/${userId}/credenciais`]}>
          <Routes>
            <Route path="/admin/usuarios/:id/credenciais" element={<AdminUserCredentialsPage />} />
            <Route path="/admin/usuarios/:id" element={<h1>Perfil</h1>} />
            <Route path="/admin/usuarios" element={<h1>Listagem</h1>} />
          </Routes>
        </MemoryRouter>
      </NotifyProvider>,
    )
  }

  function fill(username: string, password: string, confirm = password) {
    fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: username } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: password } })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: confirm } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar acesso' }))
  }

  it('RN-UI-AUTH-11: userId não é um campo editável', async () => {
    renderPage()
    expect((await screen.findAllByText('Ana')).length).toBeGreaterThan(0)
    expect(screen.queryByRole('textbox', { name: /userId/i })).toBeNull()
  })

  it('RN-UI-AUTH-09: usuário desativado não exibe o formulário', async () => {
    user = { id: 4, name: 'Inativo', roleName: 'COOK', terminatedAt: '10/10/2024 10:00:00' }
    renderPage(4)
    expect(await screen.findByText(/desativado/i)).toBeTruthy()
    expect(screen.queryByLabelText('Usuário')).toBeNull()
  })

  it('RN-UI-AUTH-10: senhas diferentes não chamam o register', async () => {
    renderPage()
    expect(await screen.findByLabelText('Usuário')).toBeTruthy()
    fill('ana', '1234', '9999')
    expect((await screen.findAllByText(/não confere/)).length).toBeGreaterThan(0)
    expect(findToast('warning')).toBeTruthy()
    expect(calls.some((call) => call.url.includes('/auth/register'))).toBe(false)
  })

  it('RN-UI-AUTH-10: senha curta não chama o register', async () => {
    renderPage()
    expect(await screen.findByLabelText('Usuário')).toBeTruthy()
    fill('ana', '123')
    expect((await screen.findAllByText(/ao menos 4/)).length).toBeGreaterThan(0)
    expect(calls.some((call) => call.url.includes('/auth/register'))).toBe(false)
  })

  it('AC-10: submit válido chama POST /auth/register e 201 gera toast success', async () => {
    renderPage()
    expect(await screen.findByLabelText('Usuário')).toBeTruthy()
    fill('  ana  ', '1234')

    await waitFor(() => {
      const post = calls.find((call) => call.url.includes('/auth/register'))
      expect(post?.method).toBe('POST')
      expect(post?.body).toEqual({ username: 'ana', password: '1234', userId: 9 })
    })
    await waitFor(() => {
      expect(findToast('success')).toBeTruthy()
    })
    expect(screen.queryByText(/próximo passo/)).toBeNull()
  })

  it('AC-10: falha no register gera toast error e o formulário continua utilizável', async () => {
    registerStatus = 500
    renderPage()
    expect(await screen.findByLabelText('Usuário')).toBeTruthy()
    fill('ana', '1234')

    await waitFor(() => {
      expect(findToast('error')).toBeTruthy()
    })
    const username = screen.getByLabelText('Usuário')
    expect(username.hasAttribute('disabled')).toBe(false)
    fireEvent.change(username, { target: { value: 'ana2' } })
    expect((username as HTMLInputElement).value).toBe('ana2')
    expect(screen.getByRole('button', { name: 'Criar acesso' }).hasAttribute('disabled')).toBe(false)
  })
})
