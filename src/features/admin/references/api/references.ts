import {
  demoCreateJobReference,
  demoDeleteJobReference,
  demoFetchJobReferenceById,
  demoFetchJobReferences,
  demoUpdateJobReference,
} from '../../../../demo/demoApi'
import { apiRequest } from '../../../../shared/api/client'
import { env } from '../../../../shared/config/env'
import type { JobReference, JobReferenceRequest } from '../../../../shared/api/types'

export function fetchAdminReferences(): Promise<JobReference[]> {
  if (env.useDemoApi) return demoFetchJobReferences()
  return apiRequest<JobReference[]>('/references')
}

/** Leitura centrada no usuário (FN-UI-COOK-PROFILE). Preferência: query; fallback: filtro local. */
export async function fetchReferencesByUserId(userId: number): Promise<JobReference[]> {
  if (env.useDemoApi) {
    const all = await demoFetchJobReferences()
    return all.filter((item) => item.userId === userId)
  }
  try {
    return await apiRequest<JobReference[]>(`/references?userId=${userId}`)
  } catch {
    const all = await apiRequest<JobReference[]>('/references')
    return all.filter((item) => item.userId === userId)
  }
}

export function fetchReferenceById(id: number): Promise<JobReference> {
  if (env.useDemoApi) return demoFetchJobReferenceById(id)
  return apiRequest<JobReference>(`/references/${id}`)
}

export function createReference(body: JobReferenceRequest): Promise<JobReference | void> {
  if (env.useDemoApi) return demoCreateJobReference(body)
  return apiRequest<void>('/references', { method: 'POST', body })
}

export function updateReference(id: number, body: JobReferenceRequest): Promise<JobReference | void> {
  if (env.useDemoApi) return demoUpdateJobReference(id, body)
  return apiRequest<void>(`/references/${id}`, { method: 'PUT', body })
}

export function deleteReference(id: number): Promise<void> {
  if (env.useDemoApi) return demoDeleteJobReference(id)
  return apiRequest<void>(`/references/${id}`, { method: 'DELETE' })
}
