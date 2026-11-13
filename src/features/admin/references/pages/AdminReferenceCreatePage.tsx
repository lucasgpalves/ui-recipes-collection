import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { JobReferenceRequest } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { JobReferenceForm } from '../components/JobReferenceForm'
import { createReference } from '../api/references'
import styles from '../../shared/pages.module.css'

export function AdminReferenceCreatePage() {
  const navigate = useNavigate()
  const notify = useNotify()
  const [searchParams] = useSearchParams()
  const preferredRestaurant = searchParams.get('restaurantName')?.trim() || ''

  const initial = useMemo<Partial<JobReferenceRequest> | undefined>(
    () => (preferredRestaurant ? { restaurantName: preferredRestaurant } : undefined),
    [preferredRestaurant],
  )

  async function handleCreate(payload: JobReferenceRequest) {
    try {
      await createReference(payload)
      notify.success('Referência de emprego cadastrada.', 'Cadastro')
      if (payload.userId) {
        navigate(`/admin/usuarios/${payload.userId}`, { replace: true })
        return
      }
      navigate('/admin/referencias', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          throw new Error('Já existe referência com período sobreposto para este cozinheiro/restaurante.')
        }
        throw new Error(`Falha ao cadastrar (status ${err.status}).`)
      }
      throw new Error('Não foi possível cadastrar a referência.')
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Nova referência</h1>
          <p>
            Atalho global. Preferencialmente cadastre pelo{' '}
            <Link to="/admin/usuarios" className={styles.inlineLink}>
              perfil do COOK
            </Link>
            .
          </p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/usuarios" className={styles.ghostButton}>
            Ir aos usuários
          </Link>
        </div>
      </header>

      <JobReferenceForm
        key={preferredRestaurant || 'new'}
        initial={initial}
        submitLabel="Cadastrar referência"
        onSubmit={handleCreate}
      />
    </div>
  )
}
