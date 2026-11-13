import { createDemoToken } from './demoToken'
import type {
  Category,
  Recipe,
  RecipeSummary,
  Review,
  Role,
  TokenResponse,
  UserRequest,
  UserResponse,
} from '../shared/api/types'
import { ApiError } from '../shared/api/client'

const DEMO_LATENCY_MS = 420
const DEMO_ADMIN_USERNAME = 'admin'
const DEMO_ADMIN_PASSWORD = 'admin'

let nextUserId = 1
const usersStore: UserResponse[] = []

async function withLatency<T>(value: T, latency = DEMO_LATENCY_MS): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, latency))
  return value
}

async function demoRequest<T>(fixtureUrl: string, latency = DEMO_LATENCY_MS): Promise<T> {
  const started = performance.now()
  const response = await fetch(fixtureUrl, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new ApiError(response.status, `Demo request failed with status ${response.status}`)
  }

  const data = (await response.json()) as T
  const elapsed = performance.now() - started
  const wait = Math.max(0, latency - elapsed)
  if (wait > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, wait))
  }
  return data
}

export function demoFetchRecipes(): Promise<RecipeSummary[]> {
  return demoRequest(new URL('./fixtures/recipes.json', import.meta.url).href)
}

export async function demoFetchRecipe(id: number): Promise<Recipe> {
  const recipes = await demoRequest<Recipe[]>(
    new URL('./fixtures/recipe-details.json', import.meta.url).href,
  )
  const recipe = recipes.find((item) => item.id === id)
  if (!recipe) {
    throw new ApiError(404, `Demo recipe ${id} not found`)
  }
  return structuredClone(recipe)
}

export function demoFetchCategories(): Promise<Category[]> {
  return demoRequest(new URL('./fixtures/categories.json', import.meta.url).href, 280)
}

export function demoFetchReviews(): Promise<Review[]> {
  return demoRequest(new URL('./fixtures/reviews.json', import.meta.url).href, 320)
}

export function demoFetchRoles(): Promise<Role[]> {
  return demoRequest(new URL('./fixtures/roles.json', import.meta.url).href, 240)
}

export async function demoLogin(username: string, password: string): Promise<TokenResponse> {
  await new Promise((resolve) => window.setTimeout(resolve, 500))
  const user = username.trim()
  const pass = password.trim()
  if (!user || !pass) {
    throw new ApiError(401, 'Credenciais inválidas')
  }

  const isAdmin = user === DEMO_ADMIN_USERNAME && pass === DEMO_ADMIN_PASSWORD
  return {
    token: createDemoToken(user, isAdmin ? 'ADMIN' : null),
  }
}

function formatDemoDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export async function demoFetchUsers(): Promise<UserResponse[]> {
  return withLatency(usersStore.map((user) => structuredClone(user)), 280)
}

export async function demoFetchUserById(id: number): Promise<UserResponse> {
  const user = usersStore.find((item) => item.id === id)
  if (!user) {
    throw new ApiError(404, `Demo user ${id} not found`)
  }
  return withLatency(structuredClone(user), 260)
}

export async function demoCreateUser(request: UserRequest): Promise<UserResponse> {
  const created: UserResponse = {
    id: nextUserId++,
    cpf: request.cpf,
    name: request.name,
    roleName: request.roleName.toUpperCase(),
    salary: request.salary,
    ingressedAt: formatDemoDateTime(new Date()),
    terminatedAt: null,
    fantasyName: request.fantasyName?.trim() ? request.fantasyName.trim() : null,
  }
  usersStore.push(created)
  return withLatency(structuredClone(created), 420)
}

export async function demoUpdateUser(id: number, request: UserRequest): Promise<UserResponse> {
  const index = usersStore.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo user ${id} not found`)
  }
  const current = usersStore[index]
  if (current.terminatedAt) {
    throw new ApiError(400, 'Demo user already terminated')
  }
  const updated: UserResponse = {
    ...current,
    cpf: request.cpf,
    name: request.name,
    roleName: request.roleName.toUpperCase(),
    salary: request.salary,
    fantasyName: request.fantasyName?.trim() ? request.fantasyName.trim() : null,
  }
  usersStore[index] = updated
  return withLatency(structuredClone(updated), 420)
}

export async function demoTerminateUser(id: number): Promise<void> {
  const index = usersStore.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo user ${id} not found`)
  }
  const current = usersStore[index]
  if (current.terminatedAt) {
    throw new ApiError(400, 'Demo user already terminated')
  }
  usersStore[index] = {
    ...current,
    terminatedAt: formatDemoDateTime(new Date()),
  }
  await withLatency(undefined, 320)
}
