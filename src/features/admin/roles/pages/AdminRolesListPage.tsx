import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { Role } from '../../../../shared/api/types'
import { deleteRole, fetchRoles } from '../api/roles'
import styles from '../../shared/pages.module.css'

export function AdminRolesListPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadRoles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchRoles()
      setRoles(data)
      setError(null)
    } catch {
      setError('Não foi possível carregar os papéis.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRoles()
  }, [loadRoles])

  async function handleDelete(role: Role) {
    if (role.id == null) return
    const confirmed = window.confirm(
      `Excluir o papel "${role.name ?? role.id}"? Usuários que usam esse papel podem falhar no cadastro.`,
    )
    if (!confirmed) return

    setDeletingId(role.id)
    setError(null)
    try {
      await deleteRole(role.id)
      const refreshed = await fetchRoles()
      setRoles(refreshed)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Falha ao excluir (status ${err.status}).`)
      } else {
        setError('Não foi possível excluir o papel.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Papéis</h1>
          <p>Gerencie os papéis usados no cadastro de usuários e nas regras de acesso.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/papeis/novo" className={styles.primaryButton}>
            Novo papel
          </Link>
        </div>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {!loading && roles.length === 0 ? (
        <p className={styles.muted}>Nenhum papel cadastrado ainda.</p>
      ) : null}

      {roles.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id ?? role.name}>
                  <td>
                    <strong>{role.name ?? '—'}</strong>
                  </td>
                  <td>{role.description || '—'}</td>
                  <td>
                    {role.id != null ? (
                      <div className={styles.rowActions}>
                        <Link to={`/admin/papeis/${role.id}/editar`} className={styles.linkButton}>
                          Editar
                        </Link>
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => void handleDelete(role)}
                          disabled={deletingId === role.id}
                        >
                          {deletingId === role.id ? 'Excluindo…' : 'Excluir'}
                        </button>
                      </div>
                    ) : (
                      <span className={styles.muted}>Sem id</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
