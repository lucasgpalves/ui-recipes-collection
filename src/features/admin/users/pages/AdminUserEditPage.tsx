import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { UserRequest, UserResponse } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { UserForm } from '../components/UserForm'
import { fetchUserById, updateUser } from '../api/users'
import styles from '../../shared/pages.module.css'

export function AdminUserEditPage() {
  const { id } = useParams()
  const userId = Number(id)
  const navigate = useNavigate()
  const notify = useNotify()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        if (active) setUser(data)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o usuário.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId])

  const initial = useMemo<Partial<UserRequest> | undefined>(() => {
    if (!user) return undefined
    return {
      cpf: user.cpf ?? '',
      name: user.name ?? '',
      roleName: user.roleName ?? '',
      salary: user.salary ?? 0,
      fantasyName: user.fantasyName ?? '',
      restaurantName: '',
    }
  }, [user])

  async function handleUpdate(payload: UserRequest) {
    try {
      await updateUser(userId, payload)
      notify.success(`Usuário "${payload.name}" atualizado.`, 'Edição')
      navigate(`/admin/usuarios/${userId}`, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(`Falha ao atualizar (status ${err.status}).`)
      }
      throw new Error('Não foi possível atualizar o usuário.')
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Editar usuário</h1>
          <p>Atualização do perfil via PUT /users/{'{id}'}.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/usuarios" className={styles.ghostButton}>
            Listagem
          </Link>
          {Number.isFinite(userId) ? (
            <Link to={`/admin/usuarios/${userId}`} className={styles.ghostButton}>
              Perfil
            </Link>
          ) : null}
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {!loading && user?.terminatedAt ? (
        <p className={styles.error}>
          Este usuário está desativado e não pode ser editado.
        </p>
      ) : null}
      {!loading && user && !user.terminatedAt && initial ? (
        <UserForm
          key={user.id ?? user.cpf ?? 'edit'}
          initial={initial}
          submitLabel="Salvar alterações"
          onSubmit={handleUpdate}
        />
      ) : null}
    </div>
  )
}
