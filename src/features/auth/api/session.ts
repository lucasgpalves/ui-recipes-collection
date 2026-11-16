import { apiRequest } from '../../../shared/api/client'
import type { AuthMeResponse } from '../../../shared/api/types'

/** RF-UI-API-06 — restaura identidade da sessão cookie HttpOnly (F-05). */
export function fetchAuthMe(): Promise<AuthMeResponse> {
  return apiRequest<AuthMeResponse>('/auth/me')
}
