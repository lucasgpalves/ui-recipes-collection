import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    useDemoApi: true,
  },
}))

import {
  createDemoToken,
  parseTokenClaims,
  roleFromToken,
  subjectFromToken,
  userIdFromToken,
} from './tokenClaims'

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fakeJwt(payload: Record<string, unknown>): string {
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const body = toBase64Url(JSON.stringify(payload))
  return `${header}.${body}.signature`
}

describe('tokenClaims', () => {
  afterEach(() => {
    vi.resetModules()
  })

  it('lê role, sub e userId de token demo', () => {
    const token = createDemoToken('cook', 'COOK', 1)
    expect(subjectFromToken(token)).toBe('cook')
    expect(roleFromToken(token)).toBe('COOK')
    expect(userIdFromToken(token)).toBe(1)
  })

  it('lê claims de JWT real (payload sem verificar assinatura)', () => {
    const token = fakeJwt({
      iss: 'auth-api',
      sub: 'chef',
      role: 'COOK',
      userId: 42,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })

    const claims = parseTokenClaims(token)
    expect(claims).toEqual({
      sub: 'chef',
      role: 'COOK',
      userId: 42,
      exp: expect.any(Number),
    })
  })

  it('normaliza ROLE_ prefix se vier no claim', () => {
    const token = fakeJwt({
      sub: 'admin',
      role: 'ROLE_ADMIN',
      userId: 7,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
    expect(roleFromToken(token)).toBe('ADMIN')
  })

  it('ignora token expirado', () => {
    const token = fakeJwt({
      sub: 'cook',
      role: 'COOK',
      userId: 1,
      exp: Math.floor(Date.now() / 1000) - 10,
    })
    expect(parseTokenClaims(token)).toBeNull()
  })

  it('retorna null para token inválido', () => {
    expect(parseTokenClaims(null)).toBeNull()
    expect(parseTokenClaims('not-a-token')).toBeNull()
    expect(roleFromToken('abc.def')).toBeNull()
  })

  it('rejeita demo.* quando useDemoApi=false (F-11)', async () => {
    vi.doMock('../config/env', () => ({
      env: { apiBaseUrl: '/api', useDemoApi: false },
    }))
    const mod = await import('./tokenClaims')
    const demo = mod.createDemoToken('cook', 'COOK', 1)
    expect(mod.parseTokenClaims(demo)).toBeNull()
  })
})
