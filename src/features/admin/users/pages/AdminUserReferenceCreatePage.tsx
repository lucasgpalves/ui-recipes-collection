import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { JobReferenceRequest, UserResponse } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { JobReferenceForm } from '../../references/components/JobReferenceForm'
import { createReference } from '../../references/api/references'
import { fetchUserById } from '../api/users'
import styles from '../../shared/pages.module.css'

export function AdminUserReferenceCreatePage() {
  const { id } = useParams()
  const userId = Number(id)
  const navigate = useNavigate()
  const notify = useNotify()
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState<UserResponse | null>(null)
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

    let active = true
    setLoading(true)
    fetchUserById(userId)
      .then((data) => {
        if (!active) return
        if (data.roleName !== 'COOK') {
          setError('Experiência profissional só se aplica a usuários COOK.')
          setUser(null)
          return
        }
        setUser(data)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o perfil.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId])

  const initial = useMemo<Partial<JobReferenceRequest>>(
    () => ({
      userId,
      ...(preferredRestaurant ? { restaurantName: preferredRestaurant } : {}),
    }),
    [userId, preferredRestaurant],
  )

  async function handleCreate(payload: JobReferenceRequest) {
    try {
      await createReference({ ...payload, userId })
      notify.success('Referência de emprego cadastrada.', 'Cadastro')
      navigate(profilePath, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          throw new Error(
            'Já existe referência com período sobreposto para este cozinheiro/restaurante.',
          )
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
            Experiência profissional de {user?.name ?? 'cozinheiro'} — o cozinheiro já está
            vinculado a este perfil.
          </p>
        </div>
        <div className={styles.actions}>
          <Link to={profilePath} className={styles.ghostButton}>
            Voltar ao perfil
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {!loading && !error && user ? (
        <JobReferenceForm
          key={`${userId}-${preferredRestaurant}`}
          initial={initial}
          fixedUserId={userId}
          fixedUserLabel={user.name ?? `Usuário #${userId}`}
          submitLabel="Cadastrar referência"
          onSubmit={handleCreate}
        />
      ) : null}
    </div>
  )
}
