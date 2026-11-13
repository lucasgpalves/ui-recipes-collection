import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { Restaurant } from '../../../../shared/api/types'
import { useConfirm } from '../../../../shared/ui/confirm'
import { useNotify } from '../../../../shared/ui/notify'
import { deleteRestaurant, fetchAdminRestaurants } from '../api/restaurants'
import styles from '../../shared/pages.module.css'

export function AdminRestaurantsListPage() {
  const notify = useNotify()
  const { confirm } = useConfirm()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadRestaurants = useCallback(async () => {
    setLoading(true)
    try {
      setRestaurants(await fetchAdminRestaurants())
    } catch {
      notify.error('Não foi possível carregar os restaurantes.', 'Falha ao carregar')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    void loadRestaurants()
  }, [loadRestaurants])

  async function handleDelete(restaurant: Restaurant) {
    if (restaurant.id == null) return
    const confirmed = await confirm({
      title: 'Excluir restaurante',
      message: `Excluir o restaurante "${restaurant.name ?? restaurant.id}"? Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    })
    if (!confirmed) return

    setDeletingId(restaurant.id)
    try {
      await deleteRestaurant(restaurant.id)
      setRestaurants(await fetchAdminRestaurants())
      notify.success(`Restaurante "${restaurant.name ?? restaurant.id}" excluído.`, 'Exclusão')
    } catch (err) {
      if (err instanceof ApiError) {
        notify.error(`Falha ao excluir (status ${err.status}).`, 'Exclusão')
      } else {
        notify.error('Não foi possível excluir o restaurante.', 'Exclusão')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Restaurantes</h1>
          <p>Cadastro de restaurantes usados nas referências de emprego.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/restaurantes/novo" className={styles.primaryButton}>
            Novo restaurante
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {!loading && restaurants.length === 0 ? (
        <p className={styles.muted}>Nenhum restaurante cadastrado ainda.</p>
      ) : null}

      {restaurants.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cidade</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((restaurant, index) => {
                const id = restaurant.id
                return (
                  <tr key={id ?? `${restaurant.name}-${index}`}>
                    <td>
                      <strong>{restaurant.name ?? '—'}</strong>
                      {restaurant.address ? (
                        <div className={styles.muted}>{restaurant.address}</div>
                      ) : null}
                    </td>
                    <td>{restaurant.city ?? '—'}</td>
                    <td>{restaurant.restaurantType ?? '—'}</td>
                    <td>{restaurant.categoryName ?? '—'}</td>
                    <td>
                      <div className={styles.rowActions}>
                        {id != null ? (
                          <Link
                            to={`/admin/restaurantes/${id}/editar`}
                            className={styles.linkButton}
                          >
                            Editar
                          </Link>
                        ) : (
                          <span className={styles.muted}>Sem id</span>
                        )}
                        {id != null ? (
                          <button
                            type="button"
                            className={styles.dangerButton}
                            onClick={() => void handleDelete(restaurant)}
                            disabled={deletingId === id}
                          >
                            {deletingId === id ? 'Excluindo…' : 'Excluir'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
