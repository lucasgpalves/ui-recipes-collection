import {
  demoCreateRole,
  demoDeleteRole,
  demoFetchRoleById,
  demoFetchRoles,
  demoUpdateRole,
} from '../../../../demo/demoApi'
import { apiRequest } from '../../../../shared/api/client'
import { env } from '../../../../shared/config/env'
import type { Role, RoleRequest } from '../../../../shared/api/types'

export function fetchRoles(): Promise<Role[]> {
  if (env.useDemoApi) return demoFetchRoles()
  return apiRequest<Role[]>('/roles')
}

export function fetchRoleById(id: number): Promise<Role> {
  if (env.useDemoApi) return demoFetchRoleById(id)
  return apiRequest<Role>(`/roles/${id}`)
}

export function createRole(body: RoleRequest): Promise<Role | void> {
  if (env.useDemoApi) return demoCreateRole(body)
  return apiRequest<void>('/roles', { method: 'POST', body })
}

export function updateRole(id: number, body: RoleRequest): Promise<Role | void> {
  if (env.useDemoApi) return demoUpdateRole(id, body)
  return apiRequest<void>(`/roles/${id}`, { method: 'PUT', body })
}

export function deleteRole(id: number): Promise<void> {
  if (env.useDemoApi) return demoDeleteRole(id)
  return apiRequest<void>(`/roles/${id}`, { method: 'DELETE' })
}
