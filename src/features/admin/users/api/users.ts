import {
  demoCreateUser,
  demoFetchUserById,
  demoFetchUsers,
  demoReactivateUser,
  demoRegisterCredentials,
  demoTerminateUser,
  demoUpdateUser,
} from '../../../../demo/demoApi'
import { apiRequest } from '../../../../shared/api/client'
import { env } from '../../../../shared/config/env'
import type { RegisterRequest, UserRequest, UserResponse } from '../../../../shared/api/types'

export function fetchUsers(): Promise<UserResponse[]> {
  if (env.useDemoApi) return demoFetchUsers()
  return apiRequest<UserResponse[]>('/users')
}

export function fetchUserById(id: number): Promise<UserResponse> {
  if (env.useDemoApi) return demoFetchUserById(id)
  return apiRequest<UserResponse>(`/users/${id}`)
}

export function createUser(body: UserRequest): Promise<UserResponse | void> {
  if (env.useDemoApi) return demoCreateUser(body)
  return apiRequest<void>('/users', { method: 'POST', body })
}

export function updateUser(id: number, body: UserRequest): Promise<UserResponse | void> {
  if (env.useDemoApi) return demoUpdateUser(id, body)
  return apiRequest<void>(`/users/${id}`, { method: 'PUT', body })
}

export function terminateUser(id: number): Promise<void> {
  if (env.useDemoApi) return demoTerminateUser(id)
  return apiRequest<void>(`/users/terminate/${id}`, { method: 'PUT' })
}

export function reactivateUser(id: number): Promise<void> {
  if (env.useDemoApi) return demoReactivateUser(id)
  return apiRequest<void>(`/users/reactivate/${id}`, { method: 'PUT' })
}

export function registerCredentials(body: RegisterRequest): Promise<void> {
  if (env.useDemoApi) return demoRegisterCredentials(body)
  return apiRequest<void>('/auth/register', { method: 'POST', body })
}
