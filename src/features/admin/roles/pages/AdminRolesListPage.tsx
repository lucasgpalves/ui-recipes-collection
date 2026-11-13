import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { Role } from '../../../../shared/api/types'
import { useConfirm } from '../../../../shared/ui/confirm'
import { useNotify } from '../../../../shared/ui/notify'
import { deleteRole, fetchRoles } from '../api/roles'
import styles from '../../shared/pages.module.css'

export function AdminRolesListPage() {
  const notify = useNotify()
  const { confirm } = useConfirm()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadRoles = useCallback(async () => {
    setLoading(true)
    try {
      setRoles(await fetchRoles())
    } catch {
      notify.error('Não foi possível carregar os papéis.', 'Falha ao carregar')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    void loadRoles()
  }, [loadRoles])

  async function handleDelete(role: Role) {
    if (role.id == null) return
    const confirmed = await confirm({
      title: 'Excluir papel',
      message: `Excluir o papel "${role.name ?? role.id}"? Usuários que usam esse papel podem falhar no cadastro.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    })
    if (!confirmed) return

    setDeletingId(role.id)
    try {
      await deleteRole(role.id)
      setRoles(await fetchRoles())
      notify.success(`Papel "${role.name ?? role.id}" excluído.`, 'Exclusão')
    } catch (err) {
      if (err instanceof ApiError) {
        notify.error(`Falha ao excluir (status ${err.status}).`, 'Exclusão')
      } else {
        notify.error('Não foi possível excluir o papel.', 'Exclusão')
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
