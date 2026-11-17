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
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const response = await fetch(url, {
    ...rest,
    credentials: env.useDemoApi ? 'same-origin' : 'include',
    headers: {
      Accept: 'application/json',
      // FormData: browser sets multipart boundary; do not force JSON Content-Type.
      ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  })

  // RF-UI-API-11 / AC-12: 401 ou 403 disparam limpeza de sessão.
  if (response.status === 401 || response.status === 403) {
    onUnauthorized?.()
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const errorText = await response.text()
      if (errorText) {
        const parsed = JSON.parse(errorText) as { detail?: unknown }
        if (typeof parsed.detail === 'string' && parsed.detail.trim()) {
          message = parsed.detail
        } else if (Array.isArray(parsed.detail)) {
          const parts = parsed.detail
            .map((item) => {
              if (typeof item === 'string') return item
              if (item && typeof item === 'object' && 'msg' in item) {
                return String((item as { msg: unknown }).msg)
              }
              return null
            })
            .filter((part): part is string => Boolean(part))
          if (parts.length > 0) message = parts.join('; ')
        }
      }
    } catch {
      /* keep status message */
    }
    throw new ApiError(response.status, message)
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
