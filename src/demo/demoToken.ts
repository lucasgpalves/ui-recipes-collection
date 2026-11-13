export type DemoTokenPayload = {
  sub: string
  role: string | null
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

export function createDemoToken(sub: string, role: string | null, ttlSeconds = 7200): string {
  const payload: DemoTokenPayload = {
    sub,
    role,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  return `${DEMO_PREFIX}${toBase64Url(JSON.stringify(payload))}`
}

export function parseDemoToken(token: string | null): DemoTokenPayload | null {
  if (!token || !token.startsWith(DEMO_PREFIX)) return null
  try {
    const payload = JSON.parse(fromBase64Url(token.slice(DEMO_PREFIX.length))) as DemoTokenPayload
    if (!payload.sub || typeof payload.exp !== 'number') return null
    if (payload.exp * 1000 < Date.now()) return null
    return {
      sub: payload.sub,
      role: payload.role ?? null,
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

export function roleFromToken(token: string | null): string | null {
  return parseDemoToken(token)?.role ?? null
}

export function subjectFromToken(token: string | null): string | null {
  return parseDemoToken(token)?.sub ?? null
}
