import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TOKEN_KEY,
  createFetchRecorder,
  installMemoryStorage,
  jsonResponse,
  jwtWithClaims,
} from '../../test-support/http'
import { ApiError, apiRequest, setMemoryToken, setUnauthorizedHandler } from './client'

vi.mock('../config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

describe('apiRequest no modo API real (FN-UI-API-FETCH)', () => {
  beforeEach(() => {
    installMemoryStorage('sessionStorage')
    installMemoryStorage('localStorage')
    setMemoryToken(null)
    setUnauthorizedHandler(null)
  })

  afterEach(() => {
    setUnauthorizedHandler(null)
    setMemoryToken(null)
    vi.unstubAllGlobals()
  })

  it('RF-UI-API-04 / RNF-UI-API-02: Bearer sai do sessionStorage e ignora localStorage', async () => {
    const token = jwtWithClaims({ sub: 'chef', role: 'COOK', userId: 42 })
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(TOKEN_KEY, 'token-local')
    const { calls, fetch } = createFetchRecorder(() => jsonResponse(200, []))
    vi.stubGlobal('fetch', fetch)

    await apiRequest('/recipes/mine')

    expect(calls[0]?.headers.get('authorization')).toBe(`Bearer ${token}`)
    expect(localStorage.getItem(TOKEN_KEY)).toBe('token-local')
  })

  it('request sem token não envia Authorization', async () => {
    const { calls, fetch } = createFetchRecorder(() => jsonResponse(200, []))
    vi.stubGlobal('fetch', fetch)

    await apiRequest('/recipes')

    expect(calls[0]?.headers.get('authorization')).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('AC-03 / RF-UI-API-11: 401 dispara limpeza de sessão e segue como erro', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    const { fetch } = createFetchRecorder(() => jsonResponse(401, {}))
    vi.stubGlobal('fetch', fetch)

    await expect(apiRequest('/recipes')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('AC-12 / RF-UI-API-11: 403 também dispara limpeza de sessão', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    const { fetch } = createFetchRecorder(() => jsonResponse(403, {}))
    vi.stubGlobal('fetch', fetch)

    await expect(apiRequest('/recipes')).rejects.toMatchObject({ status: 403 })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('404 e 500 não disparam limpeza de sessão', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    const { fetch } = createFetchRecorder((call) =>
      jsonResponse(call.url.endsWith('/missing') ? 404 : 500, {}),
    )
    vi.stubGlobal('fetch', fetch)

    await expect(apiRequest('/missing')).rejects.toMatchObject({ status: 404 })
    await expect(apiRequest('/boom')).rejects.toMatchObject({ status: 500 })
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
