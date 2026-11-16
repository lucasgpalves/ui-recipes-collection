// @vitest-environment jsdom
/**
 * FN-UI-TASTER — testes de aceitação (TDD, pré-implementação).
 *
 * Contrato de UI que a implementação em RecipeDetailPage deve satisfazer:
 * - Formulário TASTER só quando role === 'TASTER' e recipe.isPublished === true
 *   (e não for autoavaliação: recipe.userId !== session.userId).
 * - Create: labels "Nota" e "Descrição"; botão "Enviar avaliação"
 *   → POST /api/reviews { rating, description, recipeId } (camelCase; sem userId editável no form).
 * - Sucesso create → toast success + modo "Minha avaliação" com botões "Editar" e "Excluir".
 * - Edit: "Editar" → mesmos campos; "Salvar avaliação" → PUT /api/reviews/{id} { rating, description }.
 * - Delete: "Excluir" → ConfirmProvider (danger) → DELETE /api/reviews/{id}.
 * - Validação local: nota inteira 1–5 e descrição não em branco; inválido → toast warning, sem HTTP.
 * - 409 → toast error; 422 → toast warning ou error.
 * - Média pública: StarRating com aria-label /Avaliação …/ quando há reviews.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ConfirmProvider } from '../../../shared/ui/confirm'
import { NotifyProvider } from '../../../shared/ui/notify'
import {
  createFetchRecorder,
  findToast,
  jsonResponse,
  resetWebStorage,
  type FetchCall,
} from '../../../test-support/http'
import { RecipeDetailPage } from './RecipeDetail'

vi.mock('../../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

const auth = vi.hoisted(() => ({
  username: 'taster' as string | null,
  userId: 55 as number | null,
  role: 'TASTER' as string | null,
  isAuthenticated: true,
}))

const authState = () => ({
  username: auth.username,
  userId: auth.userId,
  token: null,
  isAuthenticated: auth.isAuthenticated,
  role: auth.role,
  isCook: auth.role === 'COOK',
  isAdmin: auth.role === 'ADMIN',
  isEditor: auth.role === 'EDITOR',
  login: async () => undefined,
  logout: () => undefined,
})

vi.mock('../../auth', () => ({
  useAuth: () => authState(),
  useOptionalAuth: () => authState(),
}))

const publishedDetail = {
  id: 3,
  userId: 9,
  userName: 'Ana',
  name: 'Pudim',
  categoryName: 'Doces',
  createdAt: null,
  preparationMethod: 'Assar',
  portions: 4,
  ingredients: [],
  description: 'Clássico',
  isPublished: true,
  isRated: true,
}

const otherReview = {
  id: 100,
  rating: 4,
  description: 'Muito bom',
  userId: 21,
  recipeId: 3,
}

const ownReview = {
  id: 200,
  rating: 5,
  description: 'Minha nota inicial',
  userId: 55,
  recipeId: 3,
}

type Scenario = {
  recipe: typeof publishedDetail
  reviews: Array<typeof otherReview>
  createStatus: number
  createDetail?: string
  updateStatus: number
  updateDetail?: string
  deleteStatus: number
}

describe('FN-UI-TASTER — avaliação no detalhe público', () => {
  let calls: FetchCall[] = []
  let scenario: Scenario

  beforeEach(() => {
    resetWebStorage()
    auth.username = 'taster'
    auth.userId = 55
    auth.role = 'TASTER'
    auth.isAuthenticated = true
    scenario = {
      recipe: { ...publishedDetail },
      reviews: [otherReview],
      createStatus: 200,
      updateStatus: 204,
      deleteStatus: 204,
    }

    const recorder = createFetchRecorder((call) => {
      if (call.url.includes('/auth/me')) return jsonResponse(401, {})

      if (call.url.endsWith('/recipes/3') && call.method === 'GET') {
        return jsonResponse(200, scenario.recipe)
      }

      if (call.url.endsWith('/reviews') && call.method === 'GET') {
        return jsonResponse(200, scenario.reviews)
      }

      if (call.url.endsWith('/reviews') && call.method === 'POST') {
        if (scenario.createStatus >= 400) {
          return jsonResponse(scenario.createStatus, {
            detail: scenario.createDetail ?? 'Conflict',
          })
        }
        const body = call.body as {
          rating?: number
          description?: string
          recipeId?: number
        }
        const created = {
          id: 201,
          rating: body.rating ?? 0,
          description: body.description ?? '',
          userId: auth.userId,
          recipeId: body.recipeId ?? scenario.recipe.id,
        }
        scenario.reviews = [
          ...scenario.reviews.filter((r) => r.userId !== auth.userId),
          created,
        ]
        return jsonResponse(200)
      }

      const putMatch = call.url.match(/\/reviews\/(\d+)$/)
      if (putMatch && call.method === 'PUT') {
        const id = Number(putMatch[1])
        if (scenario.updateStatus >= 400) {
          return jsonResponse(scenario.updateStatus, {
            detail: scenario.updateDetail ?? 'Unprocessable',
          })
        }
        const body = call.body as { rating?: number; description?: string }
        scenario.reviews = scenario.reviews.map((review) =>
          review.id === id
            ? {
                ...review,
                rating: body.rating ?? review.rating,
                description: body.description ?? review.description,
              }
            : review,
        )
        return new Response(null, { status: 204 })
      }

      if (putMatch && call.method === 'DELETE') {
        const id = Number(putMatch[1])
        if (scenario.deleteStatus >= 400) {
          return jsonResponse(scenario.deleteStatus, { detail: 'Forbidden' })
        }
        scenario.reviews = scenario.reviews.filter((review) => review.id !== id)
        return new Response(null, { status: 204 })
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

  function renderDetail() {
    return render(
      <NotifyProvider>
        <ConfirmProvider>
          <MemoryRouter initialEntries={['/receitas/3']}>
            <Routes>
              <Route path="/receitas/:id" element={<RecipeDetailPage />} />
            </Routes>
          </MemoryRouter>
        </ConfirmProvider>
      </NotifyProvider>,
    )
  }

  async function waitForRecipe() {
    expect(await screen.findByRole('heading', { name: 'Pudim' })).toBeTruthy()
  }

  function reviewMutations() {
    return calls.filter(
      (call) =>
        call.url.includes('/reviews') &&
        (call.method === 'POST' || call.method === 'PUT' || call.method === 'DELETE'),
    )
  }

  function fillAndSubmitCreate(rating: string, description: string) {
    fireEvent.change(screen.getByLabelText(/^nota$/i), { target: { value: rating } })
    fireEvent.change(screen.getByLabelText(/^descrição$/i), { target: { value: description } })
    fireEvent.click(screen.getByRole('button', { name: /enviar avaliação/i }))
  }

  function expectNoTasterForm() {
    expect(screen.queryByLabelText(/^nota$/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /enviar avaliação/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^editar$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^excluir$/i })).toBeNull()
    expect(screen.queryByText(/minha avaliação/i)).toBeNull()
  }

  it('AC-01: anônimo vê a média e não vê formulário de review', async () => {
    auth.isAuthenticated = false
    auth.role = null
    auth.userId = null
    auth.username = null
    renderDetail()
    await waitForRecipe()

    expect(screen.getByLabelText(/avaliação 4\.0 de 5/i)).toBeTruthy()
    expectNoTasterForm()
  })

  it('AC-01: anônimo sem reviews não vê formulário (média ausente)', async () => {
    auth.isAuthenticated = false
    auth.role = null
    auth.userId = null
    auth.username = null
    scenario.reviews = []
    scenario.recipe = { ...publishedDetail, isRated: false }
    renderDetail()
    await waitForRecipe()

    expect(screen.queryByLabelText(/avaliação .+ de 5/i)).toBeNull()
    expectNoTasterForm()
  })

  it('AC-02: TASTER cria review via POST /reviews e entra em modo minha review', async () => {
    renderDetail()
    await waitForRecipe()

    expect(screen.getByLabelText(/^nota$/i)).toBeTruthy()
    expect(screen.queryByText(/minha avaliação/i)).toBeNull()

    fillAndSubmitCreate('4', 'Ficou ótimo')

    await waitFor(() => {
      const post = reviewMutations().find((c) => c.method === 'POST')
      expect(post).toBeTruthy()
      expect(post?.url).toMatch(/\/reviews$/)
      expect(post?.body).toEqual(
        expect.objectContaining({
          rating: 4,
          description: 'Ficou ótimo',
          recipeId: 3,
        }),
      )
      // Ator vem da sessão/API — formulário não envia userId livre.
      expect(post?.body as object).not.toHaveProperty('userId')
    })

    await waitFor(() => {
      expect(findToast('success')).toBeTruthy()
      expect(screen.getByText(/minha avaliação/i)).toBeTruthy()
    })
    expect(screen.getByRole('button', { name: /^editar$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^excluir$/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /enviar avaliação/i })).toBeNull()
  })

  it('AC-03: TASTER edita a própria review via PUT (só rating/description)', async () => {
    scenario.reviews = [otherReview, ownReview]
    renderDetail()
    await waitForRecipe()

    expect(await screen.findByText(/minha avaliação/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /^editar$/i }))

    const nota = screen.getByLabelText(/^nota$/i) as HTMLInputElement
    const descricao = screen.getByLabelText(/^descrição$/i) as HTMLInputElement | HTMLTextAreaElement
    expect(nota.value).toMatch(/5/)
    expect(descricao.value).toMatch(/Minha nota inicial/)

    fireEvent.change(nota, { target: { value: '3' } })
    fireEvent.change(descricao, { target: { value: 'Ajustei a nota' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar avaliação/i }))

    await waitFor(() => {
      const put = reviewMutations().find((c) => c.method === 'PUT')
      expect(put?.url).toMatch(/\/reviews\/200$/)
      expect(put?.body).toEqual({ rating: 3, description: 'Ajustei a nota' })
    })
    await waitFor(() => {
      expect(findToast('success')).toBeTruthy()
    })
    expect(screen.getByText(/Ajustei a nota/i)).toBeTruthy()
  })

  it('AC-04: TASTER exclui a própria review via DELETE após confirmação', async () => {
    scenario.reviews = [otherReview, ownReview]
    renderDetail()
    await waitForRecipe()

    fireEvent.click(await screen.findByRole('button', { name: /^excluir$/i }))

    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /^excluir$/i }))

    await waitFor(() => {
      const del = reviewMutations().find((c) => c.method === 'DELETE')
      expect(del?.url).toMatch(/\/reviews\/200$/)
      expect(del?.method).toBe('DELETE')
    })
    await waitFor(() => {
      expect(findToast('success')).toBeTruthy()
      expect(screen.queryByText(/minha avaliação/i)).toBeNull()
    })
    expect(screen.getByRole('button', { name: /enviar avaliação/i })).toBeTruthy()
  })

  it('AC-04: cancelar confirmação não chama DELETE', async () => {
    scenario.reviews = [otherReview, ownReview]
    renderDetail()
    await waitForRecipe()

    fireEvent.click(await screen.findByRole('button', { name: /^excluir$/i }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /cancelar/i }))

    expect(reviewMutations().some((c) => c.method === 'DELETE')).toBe(false)
    expect(screen.getByText(/minha avaliação/i)).toBeTruthy()
  })

  it('AC-05: segundo create (409) mostra toast error e não duplica minha review', async () => {
    scenario.createStatus = 409
    scenario.createDetail = 'User 55 already reviewed recipe 3; use update instead'
    renderDetail()
    await waitForRecipe()

    fillAndSubmitCreate('4', 'Duplicata')

    await waitFor(() => {
      const toast = findToast('error')
      expect(toast?.textContent).toMatch(/already reviewed|update instead|409/i)
    })
    expect(screen.queryAllByText(/minha avaliação/i)).toHaveLength(0)
    expect(reviewMutations().filter((c) => c.method === 'POST')).toHaveLength(1)
  })

  it('AC-06: receita não publicada não exibe formulário TASTER', async () => {
    scenario.recipe = { ...publishedDetail, isPublished: false, isRated: false }
    scenario.reviews = []
    renderDetail()
    await waitForRecipe()
    expectNoTasterForm()
  })

  it('AC-06: receita própria (autoavaliação) não exibe formulário TASTER', async () => {
    scenario.recipe = { ...publishedDetail, userId: 55 }
    scenario.reviews = []
    renderDetail()
    await waitForRecipe()
    expectNoTasterForm()
  })

  it('AC-06: 409 de negócio (ex.: receita própria) trata toast error sem sucesso falso', async () => {
    scenario.createStatus = 409
    scenario.createDetail = 'Self-review is not allowed'
    renderDetail()
    await waitForRecipe()

    fillAndSubmitCreate('4', 'Não deveria')

    await waitFor(() => {
      expect(findToast('error')?.textContent).toMatch(/self-review|not allowed|409/i)
    })
    expect(findToast('success')).toBeFalsy()
    expect(screen.queryByText(/minha avaliação/i)).toBeNull()
  })

  it('AC-07: rating fora de 1–5 é bloqueado localmente com warning (sem POST)', async () => {
    renderDetail()
    await waitForRecipe()

    fillAndSubmitCreate('6', 'Nota inválida')

    await waitFor(() => {
      expect(findToast('warning')).toBeTruthy()
    })
    expect(reviewMutations()).toHaveLength(0)
  })

  it('AC-07: descrição em branco é bloqueada localmente com warning (sem POST)', async () => {
    renderDetail()
    await waitForRecipe()

    fillAndSubmitCreate('3', '   ')

    await waitFor(() => {
      expect(findToast('warning')).toBeTruthy()
    })
    expect(reviewMutations()).toHaveLength(0)
  })

  it('AC-07: HTTP 422 no create mostra toast e mantém formulário utilizável', async () => {
    scenario.createStatus = 422
    scenario.createDetail = 'rating must be between 1 and 5'
    renderDetail()
    await waitForRecipe()

    fillAndSubmitCreate('2', 'Payload rejeitado')

    await waitFor(() => {
      const warning = findToast('warning')
      const error = findToast('error')
      expect(warning || error).toBeTruthy()
    })
    const nota = screen.getByLabelText(/^nota$/i)
    expect(nota.hasAttribute('disabled')).toBe(false)
    fireEvent.change(nota, { target: { value: '4' } })
    expect((nota as HTMLInputElement).value).toBe('4')
  })

  it.each(['COOK', 'EDITOR', 'ADMIN'] as const)(
    'AC-08: %s autenticado não obtém formulário TASTER',
    async (role) => {
      auth.role = role
      auth.username = role.toLowerCase()
      auth.userId = 10
      auth.isAuthenticated = true
      renderDetail()
      await waitForRecipe()

      expect(screen.getByLabelText(/avaliação 4\.0 de 5/i)).toBeTruthy()
      expectNoTasterForm()
    },
  )

  it('AC-09: App não introduz rotas /taster/*', () => {
    const appPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../app/App.tsx',
    )
    const source = readFileSync(appPath, 'utf8')
    expect(source).not.toMatch(/['"`]\/taster(?:\/|['"`])/)
    expect(source).not.toMatch(/path=["'`][^"'`]*taster/)
  })
})
