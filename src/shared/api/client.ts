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

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
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
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 403 || response.status === 401) {
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
