import { createDemoToken } from './demoToken'
import type {
  Category,
  CategoryRequest,
  Goal,
  GoalProgress,
  GoalRequest,
  JobReference,
  JobReferenceRequest,
  Recipe,
  RecipeRequest,
  RecipeSummary,
  RegisterRequest,
  Restaurant,
  RestaurantRequest,
  Review,
  ReviewRequest,
  ReviewUpdateRequest,
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
const DEMO_EDITOR_USERNAME = 'editor'
const DEMO_EDITOR_PASSWORD = 'editor'
const DEMO_EDITOR_USER_ID = 12
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

let reviewsStore: Review[] | null = null
let nextReviewId = 1

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
    userId: recipe.userId ?? null,
    userName: recipe.userName,
    name: recipe.name,
    categoryName: recipe.categoryName,
    imageUrl: recipe.imageUrl,
    description: recipe.description,
    isPublished: recipe.isPublished,
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

export async function demoFetchCookRecipes(actor: {
  userId: number | null
  username: string | null
}): Promise<Recipe[]> {
  const store = await ensureRecipesDetailStore()
  const mine = store.filter((item) => {
    if (actor.userId != null && item.userId != null) {
      return item.userId === actor.userId
    }
    if (!actor.username) return false
    return (item.userName ?? '').toLowerCase() === actor.username.trim().toLowerCase()
  })
  return withLatency(mine.map((item) => structuredClone(item)), 280)
}

export async function demoCreateRecipe(
  request: RecipeRequest,
  authorUsername: string,
): Promise<Recipe> {
  const store = await ensureRecipesDetailStore()
  const created: Recipe = {
    id: nextRecipeId++,
    userId: request.userId,
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
    preparationTime: request.preparationTime,
    durationMinutes: request.preparationTime,
  }
  store.unshift(created)
  return withLatency(structuredClone(created), 420)
}

/** Demo: associa object URL local à receita (sem persistência real de arquivo). */
export async function demoUploadRecipeImage(id: number, file: File): Promise<void> {
  const store = await ensureRecipesDetailStore()
  const recipe = store.find((item) => item.id === id)
  if (!recipe) {
    throw new ApiError(404, `Demo recipe ${id} not found`)
  }
  if (recipe.isPublished) {
    throw new ApiError(409, 'Demo published recipes cannot change image')
  }
  recipe.imageUrl = URL.createObjectURL(file)
  await withLatency(undefined, 180)
}

export async function demoDeleteRecipeImage(id: number): Promise<void> {
  const store = await ensureRecipesDetailStore()
  const recipe = store.find((item) => item.id === id)
  if (!recipe) {
    throw new ApiError(404, `Demo recipe ${id} not found`)
  }
  if (recipe.isPublished) {
    throw new ApiError(409, 'Demo published recipes cannot change image')
  }
  recipe.imageUrl = null
  await withLatency(undefined, 120)
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
  const ownsById = current.userId != null && current.userId === request.userId
  const ownsByName =
    (current.userName ?? '').toLowerCase() === authorUsername.trim().toLowerCase()
  if (!ownsById && !ownsByName) {
    throw new ApiError(403, 'Demo recipe does not belong to this cook')
  }
  const updated: Recipe = {
    ...current,
    userId: request.userId,
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
    preparationTime: request.preparationTime,
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

async function ensureReviewsStore(): Promise<Review[]> {
  if (reviewsStore) return reviewsStore
  const seed = await demoRequest<Review[]>(
    new URL('./fixtures/reviews.json', import.meta.url).href,
    0,
  )
  reviewsStore = seed.map((item) => structuredClone(item))
  nextReviewId =
    Math.max(0, ...reviewsStore.map((item) => (typeof item.id === 'number' ? item.id : 0))) + 1
  return reviewsStore
}

export async function demoFetchReviews(): Promise<Review[]> {
  const store = await ensureReviewsStore()
  return withLatency(store.map((item) => structuredClone(item)), 320)
}

export async function demoCreateReview(request: ReviewRequest): Promise<void> {
  const store = await ensureReviewsStore()
  const description = request.description.trim()
  if (!Number.isInteger(request.rating) || request.rating < 1 || request.rating > 5) {
    throw new ApiError(422, 'rating must be between 1 and 5')
  }
  if (!description) {
    throw new ApiError(422, 'description must not be blank')
  }
  const duplicate = store.some(
    (item) => item.userId === DEMO_COOK_USER_ID && item.recipeId === request.recipeId,
  )
  if (duplicate) {
    throw new ApiError(409, `User already reviewed recipe ${request.recipeId}; use update instead`)
  }
  store.push({
    id: nextReviewId++,
    rating: request.rating,
    description,
    userId: DEMO_COOK_USER_ID,
    recipeId: request.recipeId,
  })
  await withLatency(undefined, 360)
}

export async function demoUpdateReview(id: number, request: ReviewUpdateRequest): Promise<void> {
  const store = await ensureReviewsStore()
  const index = store.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo review ${id} not found`)
  }
  const description = request.description.trim()
  if (!Number.isInteger(request.rating) || request.rating < 1 || request.rating > 5) {
    throw new ApiError(422, 'rating must be between 1 and 5')
  }
  if (!description) {
    throw new ApiError(422, 'description must not be blank')
  }
  store[index] = {
    ...store[index],
    rating: request.rating,
    description,
  }
  await withLatency(undefined, 340)
}

export async function demoDeleteReview(id: number): Promise<void> {
  const store = await ensureReviewsStore()
  const index = store.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo review ${id} not found`)
  }
  store.splice(index, 1)
  await withLatency(undefined, 300)
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

export async function demoFetchGoalProgress(
  id: number,
  query: { userId: number; month?: number; year?: number },
): Promise<GoalProgress> {
  const goal = await demoFetchGoalById(id)
  const progress = Math.min(2, goal.amount)
  return withLatency(
    {
      userId: query.userId,
      target: goal.amount,
      progress,
      completed: progress >= goal.amount,
    },
    220,
  )
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

  // F-15: só emite token para atores de fixture conhecidos.
  if (user === DEMO_ADMIN_USERNAME && pass === DEMO_ADMIN_PASSWORD) {
    return {
      token: createDemoToken(user, 'ADMIN', null),
      role: 'ADMIN',
      userId: null,
      username: user,
    }
  }
  if (user === DEMO_COOK_USERNAME && pass === DEMO_COOK_PASSWORD) {
    return {
      token: createDemoToken(user, 'COOK', DEMO_COOK_USER_ID),
      role: 'COOK',
      userId: DEMO_COOK_USER_ID,
      username: user,
    }
  }
  if (user === DEMO_EDITOR_USERNAME && pass === DEMO_EDITOR_PASSWORD) {
    return {
      token: createDemoToken(user, 'EDITOR', DEMO_EDITOR_USER_ID),
      role: 'EDITOR',
      userId: DEMO_EDITOR_USER_ID,
      username: user,
    }
  }

  throw new ApiError(401, 'Credenciais inválidas')
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

export async function demoReactivateUser(id: number): Promise<void> {
  const index = usersStore.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new ApiError(404, `Demo user ${id} not found`)
  }
  const current = usersStore[index]
  if (!current.terminatedAt) {
    await withLatency(undefined, 200)
    return
  }
  usersStore[index] = {
    ...current,
    terminatedAt: null,
  }
  await withLatency(undefined, 320)
}

export async function demoRegisterCredentials(_body: RegisterRequest): Promise<void> {
  await withLatency(undefined, 280)
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

type DemoEditorIngredient = {
  id: number
  name: string
  status: 'pending' | 'approved' | 'rejected'
}

let demoEditorIngredients: DemoEditorIngredient[] = [
  { id: 1, name: 'Farinha', status: 'pending' },
  { id: 2, name: 'Açúcar', status: 'approved' },
]

type DemoEditorBook = {
  id: number
  title: string
  isbn: string | null
  description: string | null
  isPublished: boolean
  recipesId: number[]
}

let demoEditorBooks: DemoEditorBook[] = [
  {
    id: 1,
    title: 'Livro demo',
    isbn: '978-3-16-148410-0',
    description: 'Rascunho',
    isPublished: false,
    recipesId: [1],
  },
]

export async function demoFetchEditorIngredients(_query?: {
  q?: string
  status?: string
}): Promise<DemoEditorIngredient[]> {
  return withLatency(structuredClone(demoEditorIngredients), 240)
}

export async function demoFetchEditorIngredientById(id: number): Promise<DemoEditorIngredient> {
  const item = demoEditorIngredients.find((ing) => ing.id === id)
  if (!item) throw new ApiError(404, `Demo ingredient ${id} not found`)
  return withLatency(structuredClone(item), 200)
}

export async function demoApproveIngredient(
  id: number,
  _body: { name?: string | null },
): Promise<void> {
  const item = demoEditorIngredients.find((ing) => ing.id === id)
  if (!item) throw new ApiError(404, `Demo ingredient ${id} not found`)
  item.status = 'approved'
  await withLatency(undefined, 200)
}

export async function demoRejectIngredient(id: number): Promise<void> {
  const item = demoEditorIngredients.find((ing) => ing.id === id)
  if (!item) throw new ApiError(404, `Demo ingredient ${id} not found`)
  item.status = 'rejected'
  await withLatency(undefined, 200)
}

export async function demoReopenIngredient(id: number): Promise<void> {
  const item = demoEditorIngredients.find((ing) => ing.id === id)
  if (!item) throw new ApiError(404, `Demo ingredient ${id} not found`)
  item.status = 'pending'
  await withLatency(undefined, 200)
}

export async function demoMergeIngredients(
  targetId: number,
  sourceIngredientId: number,
): Promise<void> {
  if (targetId === sourceIngredientId) {
    throw new ApiError(400, 'Cannot merge an ingredient into itself')
  }
  const sourceIndex = demoEditorIngredients.findIndex((ing) => ing.id === sourceIngredientId)
  if (sourceIndex < 0) throw new ApiError(404, `Demo ingredient ${sourceIngredientId} not found`)
  demoEditorIngredients.splice(sourceIndex, 1)
  await withLatency(undefined, 260)
}

export async function demoAddIngredientAlias(ingredientId: number, alias: string): Promise<void> {
  const item = demoEditorIngredients.find((ing) => ing.id === ingredientId)
  if (!item) throw new ApiError(404, `Demo ingredient ${ingredientId} not found`)
  if (alias.toLowerCase() === 'colisão') {
    throw new ApiError(409, 'Alias already exists')
  }
  await withLatency(undefined, 220)
}

export async function demoFetchEditorBooks(): Promise<DemoEditorBook[]> {
  return withLatency(structuredClone(demoEditorBooks), 240)
}

export async function demoFetchBookById(id: number): Promise<DemoEditorBook> {
  const book = demoEditorBooks.find((b) => b.id === id)
  if (!book) throw new ApiError(404, `Demo book ${id} not found`)
  return withLatency(structuredClone(book), 220)
}

export async function demoCreateBook(request: {
  title: string
  isbn: string
  description: string
  recipesId: number[]
}): Promise<DemoEditorBook> {
  const created: DemoEditorBook = {
    id: demoEditorBooks.length + 1,
    title: request.title,
    isbn: request.isbn,
    description: request.description,
    isPublished: false,
    recipesId: [...request.recipesId],
  }
  demoEditorBooks.push(created)
  return withLatency(structuredClone(created), 320)
}

export async function demoPublishBook(id: number): Promise<void> {
  const book = demoEditorBooks.find((b) => b.id === id)
  if (!book) throw new ApiError(404, `Demo book ${id} not found`)
  book.isPublished = true
  await withLatency(undefined, 280)
}

type DemoEditorialRecipe = {
  id: number
  name: string
  userId: number
  chefName: string | null
  categoryName: string | null
  isRated: boolean
  isPublished: boolean
}

const demoEditorialRecipes: DemoEditorialRecipe[] = [
  {
    id: 10,
    name: 'Bolo',
    userId: 1,
    chefName: 'chef',
    categoryName: 'Doces',
    isRated: true,
    isPublished: false,
  },
]

export async function demoFetchEditorialRecipes(_filter?: Record<string, unknown>): Promise<DemoEditorialRecipe[]> {
  return withLatency(structuredClone(demoEditorialRecipes), 260)
}
