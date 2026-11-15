import { env } from '../config/env'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  token?: string | null
}

let onUnauthorized: (() => void) | null = null
/** Mantido para AuthContext/testes; Bearer em apiRequest vem de sessionStorage (RF-UI-API-04). */
let memoryToken: string | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export function setMemoryToken(token: string | null) {
  memoryToken = token
}

export function getMemoryToken(): string | null {
  return memoryToken
}

function readSessionToken(): string | null {
  try {
    return sessionStorage.getItem('receitou.auth.token')
  } catch {
    return null
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers, ...rest } = options
  const url = `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const authToken = token === undefined ? readSessionToken() : token

  const response = await fetch(url, {
    ...rest,
    credentials: env.useDemoApi ? 'same-origin' : 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // F-13: só 401 encerra sessão; 403 é autorização (ownership/papel).
  if (response.status === 401) {
    onUnauthorized?.()
  }

  if (!response.ok) {
    throw new ApiError(response.status, `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}

export function recipeDownloadUrl(id: number): string {
  return `${env.apiBaseUrl}/recipes/${id}/download`
}
