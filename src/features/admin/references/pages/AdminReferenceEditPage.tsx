import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { JobReference, JobReferenceRequest } from '../../../../shared/api/types'
import { toDateInputValue } from '../../../../shared/lib/dates'
import { useNotify } from '../../../../shared/ui/notify'
import { JobReferenceForm } from '../components/JobReferenceForm'
import { fetchReferenceById, updateReference } from '../api/references'
import styles from '../../shared/pages.module.css'

export function AdminReferenceEditPage() {
  const { id } = useParams()
  const referenceId = Number(id)
  const navigate = useNavigate()
  const notify = useNotify()
  const [searchParams] = useSearchParams()
  const preferredRestaurant = searchParams.get('restaurantName')?.trim() || ''
  const [reference, setReference] = useState<JobReference | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(referenceId) || referenceId <= 0) {
      setError('Referência inválida.')
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    fetchReferenceById(referenceId)
      .then((data) => {
        if (active) setReference(data)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar a referência.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [referenceId])

  const initial = useMemo<Partial<JobReferenceRequest> | undefined>(() => {
    if (!reference) return undefined
    return {
      restaurantName: preferredRestaurant || reference.restaurantName || '',
      startsAt: toDateInputValue(reference.startsAt),
      endsAt: toDateInputValue(reference.endsAt),
      contactNumber: reference.contactNumber ?? '',
      userId: reference.userId ?? 0,
    }
  }, [reference, preferredRestaurant])

  async function handleUpdate(payload: JobReferenceRequest) {
    try {
      await updateReference(referenceId, payload)
      notify.success('Referência de emprego atualizada.', 'Edição')
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
        throw new Error(`Falha ao atualizar (status ${err.status}).`)
      }
      throw new Error('Não foi possível atualizar a referência.')
    }
  }

  const backHref =
    reference?.userId != null ? `/admin/usuarios/${reference.userId}` : '/admin/usuarios'

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Editar referência</h1>
          <p>Atalho global — preferencialmente edite pelo perfil do COOK.</p>
        </div>
        <div className={styles.actions}>
          <Link to={backHref} className={styles.ghostButton}>
            Voltar ao perfil
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {!loading && !error && initial ? (
        <JobReferenceForm
          key={`${referenceId}-${preferredRestaurant}`}
          initial={initial}
          submitLabel="Salvar alterações"
          onSubmit={handleUpdate}
        />
      ) : null}
    </div>
  )
}
