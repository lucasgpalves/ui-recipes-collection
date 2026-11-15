/**
 * Leitura de claims do token de sessão (demo ou JWT real da API).
 * Não verifica assinatura — só decodifica o payload para guards/UI (BUG-02).
 */

export type TokenClaims = {
  sub: string
  role: string | null
  userId: number | null
  exp: number
}

const DEMO_PREFIX = 'demo.'

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function normalizeRole(role: unknown): string | null {
  if (typeof role !== 'string' || !role.trim()) return null
  const trimmed = role.trim()
  return trimmed.startsWith('ROLE_') ? trimmed.slice(5) : trimmed
}

function normalizeUserId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function isExpired(exp: number): boolean {
  return exp * 1000 < Date.now()
}

function parseDemoClaims(token: string): TokenClaims | null {
  if (!token.startsWith(DEMO_PREFIX)) return null
  try {
    const payload = JSON.parse(fromBase64Url(token.slice(DEMO_PREFIX.length))) as Record<
      string,
      unknown
    >
    if (typeof payload.sub !== 'string' || !payload.sub) return null
    if (typeof payload.exp !== 'number') return null
    if (isExpired(payload.exp)) return null
    return {
      sub: payload.sub,
      role: normalizeRole(payload.role),
      userId: normalizeUserId(payload.userId),
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

function parseJwtClaims(token: string): TokenClaims | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payload = JSON.parse(fromBase64Url(parts[1])) as Record<string, unknown>
    if (typeof payload.sub !== 'string' || !payload.sub) return null
    if (typeof payload.exp !== 'number') return null
    if (isExpired(payload.exp)) return null
    return {
      sub: payload.sub,
      role: normalizeRole(payload.role),
      userId: normalizeUserId(payload.userId),
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

/** Cria token demo (prefixo `demo.`) compatível com parseTokenClaims. */
export function createDemoToken(
  sub: string,
  role: string | null,
  userId: number | null = null,
  ttlSeconds = 7200,
): string {
  const payload = {
    sub,
    role,
    userId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  return `${DEMO_PREFIX}${toBase64Url(JSON.stringify(payload))}`
}

export function parseTokenClaims(token: string | null): TokenClaims | null {
  if (!token) return null
  return parseDemoClaims(token) ?? parseJwtClaims(token)
}

export function roleFromToken(token: string | null): string | null {
  return parseTokenClaims(token)?.role ?? null
}

export function subjectFromToken(token: string | null): string | null {
  return parseTokenClaims(token)?.sub ?? null
}

export function userIdFromToken(token: string | null): number | null {
  return parseTokenClaims(token)?.userId ?? null
}
