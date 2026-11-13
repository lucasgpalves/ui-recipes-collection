import {
  demoCreateRestaurant,
  demoDeleteRestaurant,
  demoFetchRestaurantById,
  demoFetchRestaurants,
  demoUpdateRestaurant,
} from '../../../../demo/demoApi'
import { apiRequest } from '../../../../shared/api/client'
import { env } from '../../../../shared/config/env'
import type { Restaurant, RestaurantRequest } from '../../../../shared/api/types'

export function fetchAdminRestaurants(): Promise<Restaurant[]> {
  if (env.useDemoApi) return demoFetchRestaurants()
  return apiRequest<Restaurant[]>('/restaurants')
}

export function fetchRestaurantById(id: number): Promise<Restaurant> {
  if (env.useDemoApi) return demoFetchRestaurantById(id)
  return apiRequest<Restaurant>(`/restaurants/${id}`)
}

export function createRestaurant(body: RestaurantRequest): Promise<Restaurant | void> {
  if (env.useDemoApi) return demoCreateRestaurant(body)
  return apiRequest<void>('/restaurants', { method: 'POST', body })
}

export function updateRestaurant(id: number, body: RestaurantRequest): Promise<Restaurant | void> {
  if (env.useDemoApi) return demoUpdateRestaurant(id, body)
  return apiRequest<void>(`/restaurants/${id}`, { method: 'PUT', body })
}

export function deleteRestaurant(id: number): Promise<void> {
  if (env.useDemoApi) return demoDeleteRestaurant(id)
  return apiRequest<void>(`/restaurants/${id}`, { method: 'DELETE' })
}
