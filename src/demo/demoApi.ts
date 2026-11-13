import { createDemoToken } from './demoToken'
import type {
  Category,
  CategoryRequest,
  Goal,
  GoalRequest,
  Recipe,
  RecipeSummary,
  Review,
  Role,
  RoleRequest,
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

let categoriesStore: Category[] | null = null
let nextCategoryId = 1

let rolesStore: Role[] | null = null
let nextRoleId = 1

let goalsStore: Goal[] | null = null
let nextGoalId = 1

async function ensureCategoriesStore(): Promise<Category[]> {
  if (categoriesStore) return categoriesStore
  const seed = await demoRequest<Category[]>(
    new URL('./fixtures/categories.json', import.meta.url).href,
    0,
  )
  categoriesStore = seed.map((item) => structuredClone(item))
  nextCategoryId = Math.max(0, ...categoriesStore.map((item) => item.id)) + 1
  return categoriesStore
}

async function ensureRolesStore(): Promise<Role[]> {
  if (rolesStore) return rolesStore
  const seed = await demoRequest<Role[]>(
    new URL('./fixtures/roles.json', import.meta.url).href,
    0,
  )
  rolesStore = seed.map((item) => structuredClone(item))
  nextRoleId =
    Math.max(0, ...rolesStore.map((item) => (typeof item.id === 'number' ? item.id : 0))) + 1
  return rolesStore
}

async function ensureGoalsStore(): Promise<Goal[]> {
  if (goalsStore) return goalsStore
  const seed = await demoRequest<Goal[]>(
    new URL('./fixtures/goals.json', import.meta.url).href,
    0,
  )
  goalsStore = seed.map((item) => structuredClone(item))
  nextGoalId =
    Math.max(0, ...goalsStore.map((item) => (typeof item.id === 'number' ? item.id : 0))) + 1
  return goalsStore
}

function formatDemoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

async function resolveRoleByName(roleName: string): Promise<Role> {
  const roles = await ensureRolesStore()
  const role = roles.find((item) => item.name === roleName.toUpperCase())
  if (!role) {
    throw new ApiError(400, `Demo role not found: ${roleName}`)
  }
  return structuredClone(role)
}

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

export async function demoFetchCategories(): Promise<Category[]> {
  const store = await ensureCategoriesStore()
  return withLatency(store.map((item) => structuredClone(item)), 280)
}

export async function demoFetchCategoryById(id: number): Promise<Category> {
  const store = await ensureCategoriesStore()
  const category = store.find((item) => item.id === id)
  if (!category) {
    throw new ApiError(404, `Demo category ${id} not found`)
  }
  return withLatency(structuredClone(category), 240)
}

export async function demoCreateCategory(request: CategoryRequest): Promise<Category> {
  const store = await ensureCategoriesStore()
  const created: Category = {
    id: nextCategoryId++,
    name: request.name.trim(),
    description: request.description?.trim() ? request.description.trim() : null,
  }
  store.push(created)
  return withLatency(structuredClone(created), 380)
}

export async function demoUpdateCategory(id: number, request: CategoryRequest): Promise<Category> {
  const store = await ensureCategoriesStore()
  const index = store.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo category ${id} not found`)
  }
  const updated: Category = {
    id,
    name: request.name.trim(),
    description: request.description?.trim() ? request.description.trim() : null,
  }
  store[index] = updated
  return withLatency(structuredClone(updated), 380)
}

export async function demoDeleteCategory(id: number): Promise<void> {
  const store = await ensureCategoriesStore()
  const index = store.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo category ${id} not found`)
  }
  store.splice(index, 1)
  await withLatency(undefined, 300)
}

export function demoFetchReviews(): Promise<Review[]> {
  return demoRequest(new URL('./fixtures/reviews.json', import.meta.url).href, 320)
}

export async function demoFetchRoles(): Promise<Role[]> {
  const store = await ensureRolesStore()
  return withLatency(store.map((item) => structuredClone(item)), 240)
}

export async function demoFetchRoleById(id: number): Promise<Role> {
  const store = await ensureRolesStore()
  const role = store.find((item) => item.id === id)
  if (!role) {
    throw new ApiError(404, `Demo role ${id} not found`)
  }
  return withLatency(structuredClone(role), 220)
}

export async function demoCreateRole(request: RoleRequest): Promise<Role> {
  const store = await ensureRolesStore()
  const name = request.name.trim().toUpperCase()
  if (store.some((item) => item.name === name)) {
    throw new ApiError(400, 'Demo role already exists')
  }
  const created: Role = {
    id: nextRoleId++,
    name,
    description: request.description?.trim() ? request.description.trim() : null,
  }
  store.push(created)
  return withLatency(structuredClone(created), 360)
}

export async function demoUpdateRole(id: number, request: RoleRequest): Promise<Role> {
  const store = await ensureRolesStore()
  const index = store.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo role ${id} not found`)
  }
  const name = request.name.trim().toUpperCase()
  if (store.some((item) => item.name === name && item.id !== id)) {
    throw new ApiError(400, 'Demo role name already exists')
  }
  const updated: Role = {
    id,
    name,
    description: request.description?.trim() ? request.description.trim() : null,
  }
  store[index] = updated
  return withLatency(structuredClone(updated), 360)
}

export async function demoDeleteRole(id: number): Promise<void> {
  const store = await ensureRolesStore()
  const index = store.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo role ${id} not found`)
  }
  store.splice(index, 1)
  await withLatency(undefined, 280)
}

export async function demoFetchGoals(): Promise<Goal[]> {
  const store = await ensureGoalsStore()
  return withLatency(store.map((item) => structuredClone(item)), 260)
}

export async function demoFetchGoalById(id: number): Promise<Goal> {
  const store = await ensureGoalsStore()
  const goal = store.find((item) => item.id === id)
  if (!goal) {
    throw new ApiError(404, `Demo goal ${id} not found`)
  }
  return withLatency(structuredClone(goal), 220)
}

export async function demoCreateGoal(request: GoalRequest): Promise<Goal> {
  const store = await ensureGoalsStore()
  const role = await resolveRoleByName(request.roleName)
  const created: Goal = {
    id: nextGoalId++,
    title: request.title.trim(),
    amount: request.amount,
    description: request.description?.trim() ? request.description.trim() : '',
    startsAt: formatDemoDate(new Date()),
    role,
  }
  store.push(created)
  return withLatency(structuredClone(created), 380)
}

export async function demoUpdateGoal(id: number, request: GoalRequest): Promise<Goal> {
  const store = await ensureGoalsStore()
  const index = store.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo goal ${id} not found`)
  }
  const current = store[index]
  const role = await resolveRoleByName(request.roleName)
  const updated: Goal = {
    ...current,
    title: request.title.trim(),
    amount: request.amount,
    description: request.description?.trim() ? request.description.trim() : '',
    role,
  }
  store[index] = updated
  return withLatency(structuredClone(updated), 380)
}

export async function demoDeleteGoal(id: number): Promise<void> {
  const store = await ensureGoalsStore()
  const index = store.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo goal ${id} not found`)
  }
  store.splice(index, 1)
  await withLatency(undefined, 280)
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
