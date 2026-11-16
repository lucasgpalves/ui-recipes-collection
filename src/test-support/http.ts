export const TOKEN_KEY = 'receitou.auth.token'

export type FetchCall = {
  url: string
  method: string
  headers: Headers
  body: unknown
  credentials?: RequestCredentials
}

export function fakeJwt(payload: Record<string, unknown>): string {
  const encode = (value: string) => {
    const bytes = new TextEncoder().encode(value)
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  const header = encode(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const body = encode(JSON.stringify(payload))
  return `${header}.${body}.sig`
}

export function jwtWithClaims(claims: {
  sub: string
  role: string
  userId: number
  exp?: number
}): string {
  return fakeJwt({
    sub: claims.sub,
    role: claims.role,
    userId: claims.userId,
    exp: claims.exp ?? Math.floor(Date.now() / 1000) + 3600,
  })
}

export function resetWebStorage(): void {
  for (const name of ['sessionStorage', 'localStorage'] as const) {
    let current: Storage | null = null
    try {
      const candidate = (globalThis as unknown as Record<string, Storage | undefined>)[name]
      current = candidate ?? null
    } catch {
      current = null
    }
    if (!current || typeof current.clear !== 'function') {
      installMemoryStorage(name)
      continue
    }
    try {
      current.clear()
    } catch {
      installMemoryStorage(name)
    }
  }
}

export function installMemoryStorage(name: 'sessionStorage' | 'localStorage'): Storage {
  const store = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
  }
  Object.defineProperty(globalThis, name, { value: storage, configurable: true })
  return storage
}

export function jsonResponse(status: number, body?: unknown): Response {
  if (body === undefined) return new Response(null, { status })
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function createFetchRecorder(handler: (call: FetchCall) => Response | Promise<Response>): {
  calls: FetchCall[]
  fetch: typeof fetch
} {
  const calls: FetchCall[] = []
  const fetchImpl: typeof fetch = async (input, init) => {
    let body: unknown = null
    if (typeof init?.body === 'string' && init.body.length > 0) {
      body = JSON.parse(init.body) as unknown
    }
    const call: FetchCall = {
      url: String(input),
      method: init?.method ?? 'GET',
      headers: new Headers(init?.headers),
      body,
      credentials: init?.credentials,
    }
    calls.push(call)
    return handler(call)
  }
  return { calls, fetch: fetchImpl }
}

export function findToast(tone: 'success' | 'error' | 'warning' | 'info'): Element | undefined {
  const role = tone === 'error' ? 'alert' : 'status'
  return [...document.querySelectorAll(`[role="${role}"]`)].find((node) =>
    String(node.className).includes(tone),
  )
}
