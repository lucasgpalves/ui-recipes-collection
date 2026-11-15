import { beforeEach, describe, expect, it, vi } from 'vitest'

// RF-UI-API-01 — com useDemoApi=false, todos os módulos que bifurcam usam apiRequest (não demoApi).

const mocks = vi.hoisted(() => ({
  env: { apiBaseUrl: 'http://api.test', useDemoApi: false },
  apiRequest: vi.fn(),
  demoLogin: vi.fn(),
  demoFetchCookRecipes: vi.fn(),
  demoFetchRecipe: vi.fn(),
  demoCreateRecipe: vi.fn(),
  demoUpdateRecipe: vi.fn(),
  demoFetchUsers: vi.fn(),
  demoFetchUserById: vi.fn(),
  demoCreateUser: vi.fn(),
  demoUpdateUser: vi.fn(),
  demoTerminateUser: vi.fn(),
  demoFetchCategories: vi.fn(),
  demoFetchCategoryById: vi.fn(),
  demoCreateCategory: vi.fn(),
  demoUpdateCategory: vi.fn(),
  demoDeleteCategory: vi.fn(),
  demoFetchGoals: vi.fn(),
  demoFetchGoalById: vi.fn(),
  demoCreateGoal: vi.fn(),
  demoUpdateGoal: vi.fn(),
  demoDeleteGoal: vi.fn(),
  demoFetchRoles: vi.fn(),
  demoFetchRoleById: vi.fn(),
  demoCreateRole: vi.fn(),
  demoUpdateRole: vi.fn(),
  demoDeleteRole: vi.fn(),
  demoFetchRestaurants: vi.fn(),
  demoFetchRestaurantById: vi.fn(),
  demoCreateRestaurant: vi.fn(),
  demoUpdateRestaurant: vi.fn(),
  demoDeleteRestaurant: vi.fn(),
  demoFetchJobReferences: vi.fn(),
  demoFetchJobReferenceById: vi.fn(),
  demoCreateJobReference: vi.fn(),
  demoUpdateJobReference: vi.fn(),
  demoDeleteJobReference: vi.fn(),
}))

vi.mock('../config/env', () => ({ env: mocks.env }))
vi.mock('./client', () => ({ apiRequest: mocks.apiRequest }))
vi.mock('../../demo/demoApi', () => ({
  demoLogin: mocks.demoLogin,
  demoFetchCookRecipes: mocks.demoFetchCookRecipes,
  demoFetchRecipe: mocks.demoFetchRecipe,
  demoCreateRecipe: mocks.demoCreateRecipe,
  demoUpdateRecipe: mocks.demoUpdateRecipe,
  demoFetchUsers: mocks.demoFetchUsers,
  demoFetchUserById: mocks.demoFetchUserById,
  demoCreateUser: mocks.demoCreateUser,
  demoUpdateUser: mocks.demoUpdateUser,
  demoTerminateUser: mocks.demoTerminateUser,
  demoFetchCategories: mocks.demoFetchCategories,
  demoFetchCategoryById: mocks.demoFetchCategoryById,
  demoCreateCategory: mocks.demoCreateCategory,
  demoUpdateCategory: mocks.demoUpdateCategory,
  demoDeleteCategory: mocks.demoDeleteCategory,
  demoFetchGoals: mocks.demoFetchGoals,
  demoFetchGoalById: mocks.demoFetchGoalById,
  demoCreateGoal: mocks.demoCreateGoal,
  demoUpdateGoal: mocks.demoUpdateGoal,
  demoDeleteGoal: mocks.demoDeleteGoal,
  demoFetchRoles: mocks.demoFetchRoles,
  demoFetchRoleById: mocks.demoFetchRoleById,
  demoCreateRole: mocks.demoCreateRole,
  demoUpdateRole: mocks.demoUpdateRole,
  demoDeleteRole: mocks.demoDeleteRole,
  demoFetchRestaurants: mocks.demoFetchRestaurants,
  demoFetchRestaurantById: mocks.demoFetchRestaurantById,
  demoCreateRestaurant: mocks.demoCreateRestaurant,
  demoUpdateRestaurant: mocks.demoUpdateRestaurant,
  demoDeleteRestaurant: mocks.demoDeleteRestaurant,
  demoFetchJobReferences: mocks.demoFetchJobReferences,
  demoFetchJobReferenceById: mocks.demoFetchJobReferenceById,
  demoCreateJobReference: mocks.demoCreateJobReference,
  demoUpdateJobReference: mocks.demoUpdateJobReference,
  demoDeleteJobReference: mocks.demoDeleteJobReference,
}))

import { loginRequest, logoutRequest } from '../../features/auth/api/login'
import {
  createRecipe,
  fetchCookRecipe,
  fetchCookRecipes,
  updateRecipe,
} from '../../features/cook/recipes/api/recipes'
import {
  createUser,
  fetchUserById,
  fetchUsers,
  terminateUser,
  updateUser,
} from '../../features/admin/users/api/users'
import {
  createCategory,
  deleteCategory,
  fetchAdminCategories,
  fetchCategoryById,
  updateCategory,
} from '../../features/admin/categories/api/categories'
import {
  createGoal,
  deleteGoal,
  fetchGoalById,
  fetchGoals,
  updateGoal,
} from '../../features/admin/goals/api/goals'
import {
  createRole,
  deleteRole,
  fetchRoleById,
  fetchRoles,
  updateRole,
} from '../../features/admin/roles/api/roles'
import {
  createRestaurant,
  deleteRestaurant,
  fetchAdminRestaurants,
  fetchRestaurantById,
  updateRestaurant,
} from '../../features/admin/restaurants/api/restaurants'
import {
  createReference,
  deleteReference,
  fetchAdminReferences,
  fetchReferenceById,
  fetchReferencesByUserId,
  updateReference,
} from '../../features/admin/references/api/references'

const actor = { userId: 1, username: 'cook' }

describe('RF-UI-API-01: módulos wired usam apiRequest com useDemoApi=false', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.env.useDemoApi = false
    mocks.apiRequest.mockResolvedValue([])
  })

  it('auth: login e logout usam HTTP, não demoLogin', async () => {
    mocks.apiRequest.mockResolvedValue({ token: 'jwt' })

    await loginRequest('u', 'p')
    await logoutRequest()

    expect(mocks.apiRequest).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { username: 'u', password: 'p' },
    })
    expect(mocks.apiRequest).toHaveBeenCalledWith('/auth/logout', { method: 'POST' })
    expect(mocks.demoLogin).not.toHaveBeenCalled()
  })

  it('cook: listagem/detalhe/create/update usam apiRequest', async () => {
    mocks.apiRequest.mockResolvedValueOnce([{ id: 1, name: 'R', userName: 'cook' }])
    mocks.apiRequest.mockResolvedValue(undefined)

    await fetchCookRecipes(actor)
    await fetchCookRecipe(9)
    await createRecipe({ name: 'R' } as never, 'cook')
    await updateRecipe(9, { name: 'R' } as never, 'cook')

    expect(mocks.apiRequest).toHaveBeenCalledWith('/recipes/mine')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/recipes/9')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/recipes', {
      method: 'POST',
      body: { name: 'R' },
    })
    expect(mocks.apiRequest).toHaveBeenCalledWith('/recipes/9', {
      method: 'PUT',
      body: { name: 'R' },
    })
    expect(mocks.demoFetchCookRecipes).not.toHaveBeenCalled()
    expect(mocks.demoFetchRecipe).not.toHaveBeenCalled()
    expect(mocks.demoCreateRecipe).not.toHaveBeenCalled()
    expect(mocks.demoUpdateRecipe).not.toHaveBeenCalled()
  })

  it('admin users usam apiRequest', async () => {
    await fetchUsers()
    await fetchUserById(2)
    await createUser({} as never)
    await updateUser(2, {} as never)
    await terminateUser(2)

    expect(mocks.apiRequest).toHaveBeenCalledWith('/users')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/users/2')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/users', { method: 'POST', body: {} })
    expect(mocks.apiRequest).toHaveBeenCalledWith('/users/2', { method: 'PUT', body: {} })
    expect(mocks.apiRequest).toHaveBeenCalledWith('/users/terminate/2', { method: 'PUT' })
    expect(mocks.demoFetchUsers).not.toHaveBeenCalled()
  })

  it('admin categories usam apiRequest', async () => {
    await fetchAdminCategories()
    await fetchCategoryById(3)
    await createCategory({} as never)
    await updateCategory(3, {} as never)
    await deleteCategory(3)

    expect(mocks.apiRequest).toHaveBeenCalledWith('/categories')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/categories/3')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/categories', { method: 'POST', body: {} })
    expect(mocks.apiRequest).toHaveBeenCalledWith('/categories/3', { method: 'PUT', body: {} })
    expect(mocks.apiRequest).toHaveBeenCalledWith('/categories/3', { method: 'DELETE' })
    expect(mocks.demoFetchCategories).not.toHaveBeenCalled()
  })

  it('admin goals usam apiRequest', async () => {
    await fetchGoals()
    await fetchGoalById(4)
    await createGoal({} as never)
    await updateGoal(4, {} as never)
    await deleteGoal(4)

    expect(mocks.apiRequest).toHaveBeenCalledWith('/goals')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/goals/4')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/goals', { method: 'POST', body: {} })
    expect(mocks.apiRequest).toHaveBeenCalledWith('/goals/4', { method: 'PUT', body: {} })
    expect(mocks.apiRequest).toHaveBeenCalledWith('/goals/4', { method: 'DELETE' })
    expect(mocks.demoFetchGoals).not.toHaveBeenCalled()
  })

  it('admin roles usam apiRequest', async () => {
    await fetchRoles()
    await fetchRoleById(5)
    await createRole({} as never)
    await updateRole(5, {} as never)
    await deleteRole(5)

    expect(mocks.apiRequest).toHaveBeenCalledWith('/roles')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/roles/5')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/roles', { method: 'POST', body: {} })
    expect(mocks.apiRequest).toHaveBeenCalledWith('/roles/5', { method: 'PUT', body: {} })
    expect(mocks.apiRequest).toHaveBeenCalledWith('/roles/5', { method: 'DELETE' })
    expect(mocks.demoFetchRoles).not.toHaveBeenCalled()
  })

  it('admin restaurants usam apiRequest', async () => {
    await fetchAdminRestaurants()
    await fetchRestaurantById(6)
    await createRestaurant({} as never)
    await updateRestaurant(6, {} as never)
    await deleteRestaurant(6)

    expect(mocks.apiRequest).toHaveBeenCalledWith('/restaurants')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/restaurants/6')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/restaurants', { method: 'POST', body: {} })
    expect(mocks.apiRequest).toHaveBeenCalledWith('/restaurants/6', { method: 'PUT', body: {} })
    expect(mocks.apiRequest).toHaveBeenCalledWith('/restaurants/6', { method: 'DELETE' })
    expect(mocks.demoFetchRestaurants).not.toHaveBeenCalled()
  })

  it('admin references usam apiRequest', async () => {
    mocks.apiRequest.mockResolvedValue([{ id: 1, userId: 8 }])

    await fetchAdminReferences()
    await fetchReferencesByUserId(8)
    await fetchReferenceById(7)
    await createReference({} as never)
    await updateReference(7, {} as never)
    await deleteReference(7)

    expect(mocks.apiRequest).toHaveBeenCalledWith('/references')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/references?userId=8')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/references/7')
    expect(mocks.apiRequest).toHaveBeenCalledWith('/references', { method: 'POST', body: {} })
    expect(mocks.apiRequest).toHaveBeenCalledWith('/references/7', { method: 'PUT', body: {} })
    expect(mocks.apiRequest).toHaveBeenCalledWith('/references/7', { method: 'DELETE' })
    expect(mocks.demoFetchJobReferences).not.toHaveBeenCalled()
  })
})
