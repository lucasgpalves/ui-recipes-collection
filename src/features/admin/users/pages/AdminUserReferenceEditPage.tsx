import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { JobReference, JobReferenceRequest, UserResponse } from '../../../../shared/api/types'
import { toDateInputValue } from '../../../../shared/lib/dates'
import { useNotify } from '../../../../shared/ui/notify'
import { JobReferenceForm } from '../../references/components/JobReferenceForm'
import { fetchReferenceById, updateReference } from '../../references/api/references'
import { fetchUserById } from '../api/users'
import styles from '../../shared/pages.module.css'

export function AdminUserReferenceEditPage() {
  const { id, referenceId: referenceIdParam } = useParams()
  const userId = Number(id)
  const referenceId = Number(referenceIdParam)
  const navigate = useNavigate()
  const notify = useNotify()
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [reference, setReference] = useState<JobReference | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const profilePath = Number.isFinite(userId) ? `/admin/usuarios/${userId}` : '/admin/usuarios'
  const preferredRestaurant = searchParams.get('restaurantName')?.trim() || ''

  useEffect(() => {
    if (!Number.isFinite(userId) || userId <= 0) {
      setError('Usuário inválido.')
      setLoading(false)
      return
    }
    if (!Number.isFinite(referenceId) || referenceId <= 0) {
      setError('Referência inválida.')
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    Promise.all([fetchUserById(userId), fetchReferenceById(referenceId)])
      .then(([userData, referenceData]) => {
        if (!active) return
        if (userData.roleName !== 'COOK') {
          setError('Experiência profissional só se aplica a usuários COOK.')
          return
        }
        if (referenceData.userId != null && referenceData.userId !== userId) {
          setError('Esta referência não pertence ao perfil aberto.')
          return
        }
        setUser(userData)
        setReference(referenceData)
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
  }, [userId, referenceId])

  const initial = useMemo<Partial<JobReferenceRequest> | undefined>(() => {
    if (!reference) return undefined
    return {
      restaurantName: preferredRestaurant || reference.restaurantName || '',
      startsAt: toDateInputValue(reference.startsAt),
      endsAt: toDateInputValue(reference.endsAt),
      contactNumber: reference.contactNumber ?? '',
      userId,
    }
  }, [reference, preferredRestaurant, userId])

  async function handleUpdate(payload: JobReferenceRequest) {
    try {
      await updateReference(referenceId, { ...payload, userId })
      notify.success('Referência de emprego atualizada.', 'Edição')
      navigate(profilePath, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          throw new Error(
            'Já existe referência com período sobreposto para este cozinheiro/restaurante.',
          )
        }
        throw new Error(`Falha ao atualizar (status ${err.status}).`)
      }
      throw new Error('Não foi possível atualizar a referência.')
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Editar referência</h1>
          <p>Atualização no contexto do perfil de {user?.name ?? 'cozinheiro'}.</p>
        </div>
        <div className={styles.actions}>
          <Link to={profilePath} className={styles.ghostButton}>
            Voltar ao perfil
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {!loading && !error && initial && user ? (
        <JobReferenceForm
          key={`${referenceId}-${preferredRestaurant}`}
          initial={initial}
          fixedUserId={userId}
          fixedUserLabel={user.name ?? `Usuário #${userId}`}
          submitLabel="Salvar alterações"
          onSubmit={handleUpdate}
        />
      ) : null}
    </div>
  )
}
