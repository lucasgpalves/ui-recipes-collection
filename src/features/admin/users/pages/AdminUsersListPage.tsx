import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import { formatCpf } from '../../../../shared/lib/cpf'
import type { UserResponse } from '../../../../shared/api/types'
import { useConfirm } from '../../../../shared/ui/confirm'
import { useNotify } from '../../../../shared/ui/notify'
import { fetchUsers, terminateUser } from '../api/users'
import styles from '../../shared/pages.module.css'

export function AdminUsersListPage() {
  const notify = useNotify()
  const { confirm } = useConfirm()
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [terminatingId, setTerminatingId] = useState<number | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await fetchUsers())
    } catch {
      notify.error('Não foi possível carregar os usuários.', 'Falha ao carregar')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  async function handleTerminate(user: UserResponse) {
    if (user.id == null || user.terminatedAt) return
    const confirmed = await confirm({
      title: 'Desativar usuário',
      message: `Desativar o usuário "${user.name ?? user.id}"? Essa ação não pode ser desfeita por aqui.`,
      confirmLabel: 'Desativar',
      tone: 'danger',
    })
    if (!confirmed) return

    setTerminatingId(user.id)
    try {
      await terminateUser(user.id)
      setUsers(await fetchUsers())
      notify.success(`Usuário "${user.name ?? user.id}" desativado.`, 'Desativação')
    } catch (err) {
      if (err instanceof ApiError) {
        notify.error(`Falha ao desativar (status ${err.status}).`, 'Desativação')
      } else {
        notify.error('Não foi possível desativar o usuário.', 'Desativação')
      }
    } finally {
      setTerminatingId(null)
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Usuários</h1>
          <p>
            Listagem de perfis cadastrados. No perfil de um COOK, gerencie a experiência
            profissional.
          </p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/usuarios/novo" className={styles.primaryButton}>
            Novo usuário
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {!loading && users.length === 0 ? (
        <p className={styles.muted}>Nenhum usuário cadastrado ainda.</p>
      ) : null}

      {users.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Papel</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const id = user.id
                const terminated = Boolean(user.terminatedAt)
                return (
                  <tr key={id ?? `${user.cpf}-${user.ingressedAt}`}>
                    <td>
                      <strong>{user.name}</strong>
                      {user.fantasyName ? (
                        <div className={styles.muted}>{user.fantasyName}</div>
                      ) : null}
                    </td>
                    <td>{user.cpf ? formatCpf(user.cpf) : '—'}</td>
                    <td>{user.roleName ?? '—'}</td>
                    <td>
                      <span className={terminated ? styles.statusTerminated : styles.statusActive}>
                        {terminated ? 'Desativado' : 'Ativo'}
                      </span>
                    </td>
                    <td>
                      {id != null ? (
                        <div className={styles.rowActions}>
                          <Link to={`/admin/usuarios/${id}`} className={styles.linkButton}>
                            Perfil
                          </Link>
                          {!terminated ? (
                            <>
                              <Link to={`/admin/usuarios/${id}/editar`} className={styles.linkButton}>
                                Editar
                              </Link>
                              <button
                                type="button"
                                className={styles.dangerButton}
                                onClick={() => void handleTerminate(user)}
                                disabled={terminatingId === id}
                              >
                                {terminatingId === id ? 'Desativando…' : 'Desativar'}
                              </button>
                            </>
                          ) : null}
                        </div>
                      ) : (
                        <span className={styles.muted}>Sem id</span>
                      )}
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
