import { demoLogin } from '../../../demo/demoApi'
import { env } from '../../../shared/config/env'
import { apiRequest } from '../../../shared/api/client'
import type { TokenResponse } from '../../../shared/api/types'

export function loginRequest(username: string, password: string): Promise<TokenResponse> {
  if (env.useDemoApi) return demoLogin(username, password)
  return apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}
