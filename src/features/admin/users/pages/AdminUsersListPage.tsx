import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCpf } from '../../../../shared/lib/cpf'
import type { UserResponse } from '../../../../shared/api/types'
import { fetchUsers } from '../api/users'
import styles from './users.module.css'

export function AdminUsersListPage() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchUsers()
      .then((data) => {
        if (active) setUsers(data)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar os usuários.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Usuários</h1>
          <p>Listagem de perfis cadastrados. Abra um perfil para visualizar ou editar.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/usuarios/novo" className={styles.primaryButton}>
            Novo usuário
          </Link>
        </div>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}
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
                            <Link to={`/admin/usuarios/${id}/editar`} className={styles.linkButton}>
                              Editar
                            </Link>
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
