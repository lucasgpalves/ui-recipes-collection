import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFetchRecorder, installMemoryStorage, jsonResponse } from '../../../test-support/http'
import { loginRequest } from './login'

vi.mock('../../../shared/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: false,
  },
}))

describe('loginRequest na API real (RF-UI-API-05)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('envia POST /auth/login com username e password', async () => {
    installMemoryStorage('sessionStorage')
    installMemoryStorage('localStorage')
    const { calls, fetch } = createFetchRecorder(() =>
      jsonResponse(200, { token: 'jwt', username: 'chef', role: 'COOK', userId: 42 }),
    )
    vi.stubGlobal('fetch', fetch)

    const response = await loginRequest('chef', 'secret')

    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toBe('/api/auth/login')
    expect(calls[0]?.method).toBe('POST')
    expect(calls[0]?.body).toEqual({ username: 'chef', password: 'secret' })
    expect(response.token).toBe('jwt')
  })
})
