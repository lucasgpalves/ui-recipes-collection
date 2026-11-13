import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { Restaurant, RestaurantRequest } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { fetchAdminCategories } from '../../categories/api/categories'
import { RestaurantForm } from '../components/RestaurantForm'
import { fetchRestaurantById, updateRestaurant } from '../api/restaurants'
import styles from '../../shared/pages.module.css'

export function AdminRestaurantEditPage() {
  const { id } = useParams()
  const restaurantId = Number(id)
  const navigate = useNavigate()
  const notify = useNotify()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [resolvedCategoryId, setResolvedCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(restaurantId) || restaurantId <= 0) {
      setError('Restaurante inválido.')
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    Promise.all([fetchRestaurantById(restaurantId), fetchAdminCategories()])
      .then(([data, categories]) => {
        if (!active) return
        setRestaurant(data)
        const fromData = data.categoryId
        if (typeof fromData === 'number' && fromData > 0) {
          setResolvedCategoryId(fromData)
          return
        }
        const byName = categories.find((item) => item.name === data.categoryName)
        setResolvedCategoryId(byName?.id ?? null)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o restaurante.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [restaurantId])

  const initial = useMemo<Partial<RestaurantRequest> | undefined>(() => {
    if (!restaurant || resolvedCategoryId == null) return undefined
    return {
      name: restaurant.name ?? '',
      city: restaurant.city ?? '',
      address: restaurant.address ?? '',
      restaurantType: restaurant.restaurantType ?? '',
      cnpj: restaurant.cnpj ?? '',
      categoryId: resolvedCategoryId,
    }
  }, [restaurant, resolvedCategoryId])

  async function handleUpdate(payload: RestaurantRequest) {
    try {
      await updateRestaurant(restaurantId, payload)
      notify.success(`Restaurante "${payload.name}" atualizado.`, 'Edição')
      navigate('/admin/restaurantes', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(`Falha ao atualizar (status ${err.status}).`)
      }
      throw new Error('Não foi possível atualizar o restaurante.')
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Editar restaurante</h1>
          <p>Atualização via PUT /restaurants/{'{id}'}.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/restaurantes" className={styles.ghostButton}>
            Voltar à listagem
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {!loading && !error && initial ? (
        <RestaurantForm
          key={restaurantId}
          initial={initial}
          submitLabel="Salvar alterações"
          onSubmit={handleUpdate}
        />
      ) : null}
    </div>
  )
}
