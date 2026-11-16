import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFetchRecorder, installMemoryStorage, jsonResponse } from '../../../../test-support/http'
import {
  addIngredientAlias,
  approveIngredient,
  fetchEditorIngredients,
  mergeIngredients,
  rejectIngredient,
  reopenIngredient,
} from './ingredients'

vi.mock('../../../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

describe('FN-UI-EDITOR — ingredients API (RF-UI-ED-07 / RF-UI-ED-08)', () => {
  beforeEach(() => {
    installMemoryStorage('sessionStorage')
    installMemoryStorage('localStorage')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('RF-UI-ED-07: GET /ingredients com filtros opcionais', async () => {
    const { calls, fetch } = createFetchRecorder(() =>
      jsonResponse(200, [{ id: 1, name: 'Farinha', status: 'pending' }]),
    )
    vi.stubGlobal('fetch', fetch)

    await fetchEditorIngredients({ q: 'far', status: 'pending' })

    expect(calls[0]?.url).toBe('/api/ingredients?q=far&status=pending')
    expect(calls[0]?.method).toBe('GET')
  })

  it('RF-UI-ED-08: approve POST /ingredients/{id}/approve com corpo vazio', async () => {
    const { calls, fetch } = createFetchRecorder(() => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)

    await approveIngredient(4, {})

    expect(calls[0]?.url).toBe('/api/ingredients/4/approve')
    expect(calls[0]?.method).toBe('POST')
    expect(calls[0]?.body).toEqual({})
  })

  it('RF-UI-ED-08: reject POST /ingredients/{id}/reject', async () => {
    const { calls, fetch } = createFetchRecorder(() => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)

    await rejectIngredient(3)

    expect(calls[0]?.url).toBe('/api/ingredients/3/reject')
    expect(calls[0]?.method).toBe('POST')
  })

  it('RF-UI-ED-08: reopen POST /ingredients/{id}/reopen', async () => {
    const { calls, fetch } = createFetchRecorder(() => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)

    await reopenIngredient(2)

    expect(calls[0]?.url).toBe('/api/ingredients/2/reopen')
    expect(calls[0]?.method).toBe('POST')
  })

  it('RF-UI-ED-10: merge POST /ingredients/{targetId}/merge com sourceIngredientId', async () => {
    const { calls, fetch } = createFetchRecorder(() => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)

    await mergeIngredients(10, 4)

    expect(calls[0]?.url).toBe('/api/ingredients/10/merge')
    expect(calls[0]?.method).toBe('POST')
    expect(calls[0]?.body).toEqual({ sourceIngredientId: 4 })
  })

  it('RF-UI-ED-09: alias POST /ingredients/{id}/aliases', async () => {
    const { calls, fetch } = createFetchRecorder(() => jsonResponse(201, { id: 9, alias: 'Farinha branca' }))
    vi.stubGlobal('fetch', fetch)

    await addIngredientAlias(5, 'Farinha branca')

    expect(calls[0]?.url).toBe('/api/ingredients/5/aliases')
    expect(calls[0]?.method).toBe('POST')
    expect(calls[0]?.body).toEqual({ alias: 'Farinha branca' })
  })
})