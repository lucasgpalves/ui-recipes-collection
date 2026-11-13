import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { RestaurantRequest } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { RestaurantForm } from '../components/RestaurantForm'
import { createRestaurant } from '../api/restaurants'
import styles from '../../shared/pages.module.css'

function buildReturnUrl(returnTo: string, restaurantName: string): string {
  try {
    const url = new URL(returnTo, window.location.origin)
    if (url.origin !== window.location.origin) {
      return '/admin/restaurantes'
    }
    url.searchParams.set('restaurantName', restaurantName)
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/admin/restaurantes'
  }
}

export function AdminRestaurantCreatePage() {
  const navigate = useNavigate()
  const notify = useNotify()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')?.trim() || ''
  const backHref = returnTo || '/admin/restaurantes'
  const fromReferenceFlow = Boolean(returnTo)

  async function handleCreate(payload: RestaurantRequest) {
    try {
      await createRestaurant(payload)
      notify.success(`Restaurante "${payload.name}" cadastrado.`, 'Cadastro')
      if (returnTo) {
        navigate(buildReturnUrl(returnTo, payload.name), { replace: true })
        return
      }
      navigate('/admin/restaurantes', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(`Falha ao cadastrar (status ${err.status}).`)
      }
      throw new Error('Não foi possível cadastrar o restaurante.')
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Novo restaurante</h1>
          <p>
            {fromReferenceFlow
              ? 'Cadastro auxiliar para vincular na referência de emprego.'
              : 'Cadastro alinhado ao RestaurantRequestDTO da API.'}
          </p>
        </div>
        <div className={styles.actions}>
          <Link to={backHref} className={styles.ghostButton}>
            {fromReferenceFlow ? 'Voltar à referência' : 'Voltar à listagem'}
          </Link>
        </div>
      </header>

      <RestaurantForm submitLabel="Cadastrar restaurante" onSubmit={handleCreate} />
    </div>
  )
}
