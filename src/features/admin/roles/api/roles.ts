import { demoFetchRoles } from '../../../../demo/demoApi'
import { apiRequest } from '../../../../shared/api/client'
import { env } from '../../../../shared/config/env'
import type { Role } from '../../../../shared/api/types'

export function fetchRoles(): Promise<Role[]> {
  if (env.useDemoApi) return demoFetchRoles()
  return apiRequest<Role[]>('/roles')
}
