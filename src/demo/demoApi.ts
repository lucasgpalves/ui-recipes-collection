import { createDemoToken } from './demoToken'
import type {
  Category,
  CategoryRequest,
  Goal,
  GoalRequest,
  JobReference,
  JobReferenceRequest,
  Recipe,
  RecipeRequest,
  RecipeSummary,
  Restaurant,
  RestaurantRequest,
  Review,
  Role,
  RoleRequest,
  TokenResponse,
  UserRequest,
  UserResponse,
} from '../shared/api/types'
import { ApiError } from '../shared/api/client'
import { formatBrDate, isValidIsoDate } from '../shared/lib/dates'

const DEMO_LATENCY_MS = 420
const DEMO_ADMIN_USERNAME = 'admin'
const DEMO_ADMIN_PASSWORD = 'admin'
const DEMO_COOK_USERNAME = 'cook'
const DEMO_COOK_PASSWORD = 'cook'
/** userId fixo do cook demo para RecipeRequestDTO. */
export const DEMO_COOK_USER_ID = 1

let nextUserId = 2
/** Seed alinhado ao job-references.json (userId 1 = COOK). */
const usersStore: UserResponse[] = [
  {
    id: 1,
    cpf: '52998224725',
    name: 'Cozinheiro Demo',
    roleName: 'COOK',
    salary: 4500,
    ingressedAt: '01/01/2023 09:00:00',
    terminatedAt: null,
    fantasyName: null,
  },
]

let categoriesStore: Category[] | null = null
let nextCategoryId = 1

let rolesStore: Role[] | null = null
let nextRoleId = 1

let goalsStore: Goal[] | null = null
let nextGoalId = 1

let recipesDetailStore: Recipe[] | null = null
let nextRecipeId = 1

let restaurantsStore: Restaurant[] | null = null
let nextRestaurantId = 1

let jobReferencesStore: JobReference[] | null = null
let nextJobReferenceId = 1

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

async function ensureRecipesDetailStore(): Promise<Recipe[]> {
  if (recipesDetailStore) return recipesDetailStore
  const seed = await demoRequest<Recipe[]>(
    new URL('./fixtures/recipe-details.json', import.meta.url).href,
    0,
  )
  recipesDetailStore = seed.map((item) => structuredClone(item))
  nextRecipeId =
    Math.max(0, ...recipesDetailStore.map((item) => (typeof item.id === 'number' ? item.id : 0))) +
    1
  return recipesDetailStore
}

function toRecipeSummary(recipe: Recipe): RecipeSummary {
  return {
    id: recipe.id,
    userName: recipe.userName,
    name: recipe.name,
    categoryName: recipe.categoryName,
    imageUrl: recipe.imageUrl,
    description: recipe.description,
  }
}

export async function demoFetchRecipes(): Promise<RecipeSummary[]> {
  const store = await ensureRecipesDetailStore()
  return withLatency(store.map(toRecipeSummary), DEMO_LATENCY_MS)
}

export async function demoFetchRecipe(id: number): Promise<Recipe> {
  const store = await ensureRecipesDetailStore()
  const recipe = store.find((item) => item.id === id)
  if (!recipe) {
    throw new ApiError(404, `Demo recipe ${id} not found`)
  }
  return withLatency(structuredClone(recipe), DEMO_LATENCY_MS)
}

export async function demoFetchCookRecipes(authorUsername: string): Promise<Recipe[]> {
  const store = await ensureRecipesDetailStore()
  const mine = store.filter(
    (item) => (item.userName ?? '').toLowerCase() === authorUsername.trim().toLowerCase(),
  )
  return withLatency(mine.map((item) => structuredClone(item)), 280)
}

export async function demoCreateRecipe(
  request: RecipeRequest,
  authorUsername: string,
): Promise<Recipe> {
  const store = await ensureRecipesDetailStore()
  const created: Recipe = {
    id: nextRecipeId++,
    userName: authorUsername.trim() || 'cook',
    name: request.name.trim(),
    categoryName: request.categoryName.trim(),
    createdAt: formatDemoDateTime(new Date()),
    preparationMethod: request.preparationMethod.trim(),
    portions: request.portions,
    ingredients: request.ingredientsRecipe.map((item) => ({
      amount: item.amount,
      ingredientName: item.ingredientName.trim(),
      measurementName: item.measurementName.trim(),
    })),
    description: request.description?.trim() ? request.description.trim() : '',
    isPublished: false,
    isRated: false,
    durationMinutes: request.preparationTime,
  }
  store.unshift(created)
  return withLatency(structuredClone(created), 420)
}

export async function demoUpdateRecipe(
  id: number,
  request: RecipeRequest,
  authorUsername: string,
): Promise<Recipe> {
  const store = await ensureRecipesDetailStore()
  const index = store.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo recipe ${id} not found`)
  }
  const current = store[index]
  if ((current.userName ?? '').toLowerCase() !== authorUsername.trim().toLowerCase()) {
    throw new ApiError(403, 'Demo recipe does not belong to this cook')
  }
  const updated: Recipe = {
    ...current,
    name: request.name.trim(),
    categoryName: request.categoryName.trim(),
    preparationMethod: request.preparationMethod.trim(),
    portions: request.portions,
    ingredients: request.ingredientsRecipe.map((item) => ({
      amount: item.amount,
      ingredientName: item.ingredientName.trim(),
      measurementName: item.measurementName.trim(),
    })),
    description: request.description?.trim() ? request.description.trim() : '',
    durationMinutes: request.preparationTime,
  }
  store[index] = updated
  return withLatency(structuredClone(updated), 420)
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

  let role: string | null = null
  let userId: number | null = null
  if (user === DEMO_ADMIN_USERNAME && pass === DEMO_ADMIN_PASSWORD) {
    role = 'ADMIN'
    userId = null
  } else if (user === DEMO_COOK_USERNAME && pass === DEMO_COOK_PASSWORD) {
    role = 'COOK'
    userId = DEMO_COOK_USER_ID
  }

  return {
    token: createDemoToken(user, role, userId),
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

async function ensureRestaurantsStore(): Promise<Restaurant[]> {
  if (restaurantsStore) return restaurantsStore
  const seed = await demoRequest<Restaurant[]>(
    new URL('./fixtures/restaurants.json', import.meta.url).href,
    0,
  )
  restaurantsStore = seed.map((item) => structuredClone(item))
  nextRestaurantId =
    Math.max(0, ...restaurantsStore.map((item) => (typeof item.id === 'number' ? item.id : 0))) + 1
  return restaurantsStore
}

async function ensureJobReferencesStore(): Promise<JobReference[]> {
  if (jobReferencesStore) return jobReferencesStore
  const seed = await demoRequest<JobReference[]>(
    new URL('./fixtures/job-references.json', import.meta.url).href,
    0,
  )
  jobReferencesStore = seed.map((item) => structuredClone(item))
  nextJobReferenceId =
    Math.max(
      0,
      ...jobReferencesStore.map((item) => (typeof item.id === 'number' ? item.id : 0)),
    ) + 1
  return jobReferencesStore
}

async function resolveCategoryForRestaurant(categoryId: number): Promise<Category> {
  const categories = await ensureCategoriesStore()
  const category = categories.find((item) => item.id === categoryId)
  if (!category) {
    throw new ApiError(400, `Demo category ${categoryId} not found`)
  }
  return category
}

export async function demoFetchRestaurants(): Promise<Restaurant[]> {
  const store = await ensureRestaurantsStore()
  return withLatency(store.map((item) => structuredClone(item)), 260)
}

export async function demoFetchRestaurantById(id: number): Promise<Restaurant> {
  const store = await ensureRestaurantsStore()
  const restaurant = store.find((item) => item.id === id)
  if (!restaurant) {
    throw new ApiError(404, `Demo restaurant ${id} not found`)
  }
  return withLatency(structuredClone(restaurant), 220)
}

export async function demoCreateRestaurant(request: RestaurantRequest): Promise<Restaurant> {
  const store = await ensureRestaurantsStore()
  const category = await resolveCategoryForRestaurant(request.categoryId)
  const created: Restaurant = {
    id: nextRestaurantId++,
    name: request.name.trim(),
    city: request.city.trim(),
    address: request.address.trim(),
    restaurantType: request.restaurantType.trim(),
    cnpj: request.cnpj?.trim() ? request.cnpj.trim() : null,
    categoryName: category.name,
    categoryId: category.id,
  }
  store.push(created)
  return withLatency(structuredClone(created), 380)
}

export async function demoUpdateRestaurant(
  id: number,
  request: RestaurantRequest,
): Promise<Restaurant> {
  const store = await ensureRestaurantsStore()
  const index = store.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo restaurant ${id} not found`)
  }
  const category = await resolveCategoryForRestaurant(request.categoryId)
  const updated: Restaurant = {
    id,
    name: request.name.trim(),
    city: request.city.trim(),
    address: request.address.trim(),
    restaurantType: request.restaurantType.trim(),
    cnpj: request.cnpj?.trim() ? request.cnpj.trim() : null,
    categoryName: category.name,
    categoryId: category.id,
  }
  store[index] = updated
  return withLatency(structuredClone(updated), 380)
}

export async function demoDeleteRestaurant(id: number): Promise<void> {
  const store = await ensureRestaurantsStore()
  const index = store.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo restaurant ${id} not found`)
  }
  const name = store[index].name
  const refs = await ensureJobReferencesStore()
  if (refs.some((item) => item.restaurantName === name)) {
    throw new ApiError(400, 'Demo restaurant has job references')
  }
  store.splice(index, 1)
  await withLatency(undefined, 280)
}

function assertCookUser(userId: number): UserResponse {
  const user = usersStore.find((item) => item.id === userId)
  if (!user) {
    throw new ApiError(404, `Demo user ${userId} not found`)
  }
  if (user.roleName !== 'COOK') {
    throw new ApiError(400, 'This user is not a COOK!')
  }
  if (user.terminatedAt) {
    throw new ApiError(400, 'Demo user is terminated')
  }
  return user
}

function assertRestaurantName(restaurantName: string): Restaurant {
  if (!restaurantsStore) {
    throw new ApiError(400, 'Demo restaurants not loaded')
  }
  const restaurant = restaurantsStore.find(
    (item) => (item.name ?? '').toLowerCase() === restaurantName.trim().toLowerCase(),
  )
  if (!restaurant) {
    throw new ApiError(404, `Demo restaurant "${restaurantName}" not found`)
  }
  return restaurant
}

function periodsOverlap(
  startA: string,
  endA: string | null,
  startB: string,
  endB: string | null,
): boolean {
  const a0 = startA
  const a1 = endA ?? '9999-12-31'
  const b0 = startB
  const b1 = endB ?? '9999-12-31'
  return a0 <= b1 && b0 <= a1
}

function toIsoFromStored(value: string | null): string | null {
  if (!value) return null
  if (isValidIsoDate(value)) return value
  const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  return null
}

export async function demoFetchJobReferences(): Promise<JobReference[]> {
  await ensureRestaurantsStore()
  const store = await ensureJobReferencesStore()
  return withLatency(store.map((item) => structuredClone(item)), 260)
}

export async function demoFetchJobReferenceById(id: number): Promise<JobReference> {
  await ensureRestaurantsStore()
  const store = await ensureJobReferencesStore()
  const item = store.find((ref) => ref.id === id)
  if (!item) {
    throw new ApiError(404, `Demo job reference ${id} not found`)
  }
  return withLatency(structuredClone(item), 220)
}

export async function demoCreateJobReference(
  request: JobReferenceRequest,
): Promise<JobReference> {
  await ensureRestaurantsStore()
  const store = await ensureJobReferencesStore()
  const user = assertCookUser(request.userId)
  const restaurant = assertRestaurantName(request.restaurantName)

  if (!isValidIsoDate(request.startsAt)) {
    throw new ApiError(400, 'Invalid startsAt')
  }
  const endsAt = request.endsAt?.trim() ? request.endsAt.trim() : null
  if (endsAt && !isValidIsoDate(endsAt)) {
    throw new ApiError(400, 'Invalid endsAt')
  }
  if (endsAt && endsAt < request.startsAt) {
    throw new ApiError(400, 'endsAt must be >= startsAt')
  }

  const contact = request.contactNumber.trim()
  if (!contact || !/^[\d+\-() ]+$/.test(contact)) {
    throw new ApiError(400, 'Invalid contactNumber')
  }

  const overlap = store.some((item) => {
    if (item.userId !== request.userId) return false
    if ((item.restaurantName ?? '').toLowerCase() !== (restaurant.name ?? '').toLowerCase()) {
      return false
    }
    const existingStart = toIsoFromStored(item.startsAt)
    const existingEnd = toIsoFromStored(item.endsAt)
    if (!existingStart) return false
    return periodsOverlap(request.startsAt, endsAt, existingStart, existingEnd)
  })
  if (overlap) {
    throw new ApiError(409, 'Overlapping job reference period')
  }

  const created: JobReference = {
    id: nextJobReferenceId++,
    restaurantName: restaurant.name,
    startsAt: formatBrDate(request.startsAt),
    endsAt: formatBrDate(endsAt),
    contactNumber: contact,
    userId: user.id ?? request.userId,
    user: {
      name: user.name,
      roleName: user.roleName,
      fantasyName: user.fantasyName,
    },
  }
  store.push(created)
  return withLatency(structuredClone(created), 380)
}

export async function demoUpdateJobReference(
  id: number,
  request: JobReferenceRequest,
): Promise<JobReference> {
  await ensureRestaurantsStore()
  const store = await ensureJobReferencesStore()
  const index = store.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo job reference ${id} not found`)
  }

  const user = assertCookUser(request.userId)
  const restaurant = assertRestaurantName(request.restaurantName)

  if (!isValidIsoDate(request.startsAt)) {
    throw new ApiError(400, 'Invalid startsAt')
  }
  const endsAt = request.endsAt?.trim() ? request.endsAt.trim() : null
  if (endsAt && !isValidIsoDate(endsAt)) {
    throw new ApiError(400, 'Invalid endsAt')
  }
  if (endsAt && endsAt < request.startsAt) {
    throw new ApiError(400, 'endsAt must be >= startsAt')
  }

  const contact = request.contactNumber.trim()
  if (!contact || !/^[\d+\-() ]+$/.test(contact)) {
    throw new ApiError(400, 'Invalid contactNumber')
  }

  const overlap = store.some((item, itemIndex) => {
    if (itemIndex === index) return false
    if (item.userId !== request.userId) return false
    if ((item.restaurantName ?? '').toLowerCase() !== (restaurant.name ?? '').toLowerCase()) {
      return false
    }
    const existingStart = toIsoFromStored(item.startsAt)
    const existingEnd = toIsoFromStored(item.endsAt)
    if (!existingStart) return false
    return periodsOverlap(request.startsAt, endsAt, existingStart, existingEnd)
  })
  if (overlap) {
    throw new ApiError(409, 'Overlapping job reference period')
  }

  const updated: JobReference = {
    id,
    restaurantName: restaurant.name,
    startsAt: formatBrDate(request.startsAt),
    endsAt: formatBrDate(endsAt),
    contactNumber: contact,
    userId: user.id ?? request.userId,
    user: {
      name: user.name,
      roleName: user.roleName,
      fantasyName: user.fantasyName,
    },
  }
  store[index] = updated
  return withLatency(structuredClone(updated), 380)
}

export async function demoDeleteJobReference(id: number): Promise<void> {
  const store = await ensureJobReferencesStore()
  const index = store.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo job reference ${id} not found`)
  }
  store.splice(index, 1)
  await withLatency(undefined, 280)
}
