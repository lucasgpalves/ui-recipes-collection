import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { Role, RoleRequest } from '../../../../shared/api/types'
import { RoleForm } from '../components/RoleForm'
import { fetchRoleById, updateRole } from '../api/roles'
import styles from '../../shared/pages.module.css'

export function AdminRoleEditPage() {
  const { id } = useParams()
  const roleId = Number(id)
  const navigate = useNavigate()
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(roleId) || roleId <= 0) {
      setError('Papel inválido.')
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    fetchRoleById(roleId)
      .then((data) => {
        if (active) setRole(data)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o papel.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [roleId])

  const initial = useMemo<Partial<RoleRequest> | undefined>(() => {
    if (!role) return undefined
    return {
      name: role.name ?? '',
      description: role.description ?? '',
    }
  }, [role])

  async function handleUpdate(payload: RoleRequest) {
    try {
      await updateRole(roleId, payload)
      navigate('/admin/papeis', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(`Falha ao atualizar (status ${err.status}).`)
      }
      throw new Error('Não foi possível atualizar o papel.')
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Editar papel</h1>
          <p>Atualização via PUT /roles/{'{id}'}.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/papeis" className={styles.ghostButton}>
            Listagem
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {!loading && role && initial ? (
        <RoleForm
          key={role.id ?? role.name ?? 'edit'}
          initial={initial}
          submitLabel="Salvar alterações"
          onSubmit={handleUpdate}
        />
      ) : null}
    </div>
  )
}
