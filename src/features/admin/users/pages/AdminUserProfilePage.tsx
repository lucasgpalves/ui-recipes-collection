import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import { formatCpf } from '../../../../shared/lib/cpf'
import { formatMoney } from '../../../../shared/lib/money'
import type { UserResponse } from '../../../../shared/api/types'
import { fetchUserById, terminateUser } from '../api/users'
import styles from '../../shared/pages.module.css'

export function AdminUserProfilePage() {
  const { id } = useParams()
  const userId = Number(id)
  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [terminating, setTerminating] = useState(false)
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
        if (active) setError('Não foi possível carregar o perfil.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId])

  async function handleTerminate() {
    if (!user?.id || user.terminatedAt) return
    const confirmed = window.confirm(
      `Desativar o usuário "${user.name ?? user.id}"? Essa ação marca terminatedAt e não pode ser desfeita por aqui.`,
    )
    if (!confirmed) return

    setTerminating(true)
    setError(null)
    try {
      await terminateUser(user.id)
      const refreshed = await fetchUserById(user.id)
      setUser(refreshed)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Falha ao desativar (status ${err.status}).`)
      } else {
        setError('Não foi possível desativar o usuário.')
      }
    } finally {
      setTerminating(false)
    }
  }

  const terminated = Boolean(user?.terminatedAt)

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Perfil</h1>
          <p>Visualização do cadastro do usuário.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/usuarios" className={styles.ghostButton}>
            Listagem
          </Link>
          {user?.id != null && !terminated ? (
            <Link to={`/admin/usuarios/${user.id}/editar`} className={styles.primaryButton}>
              Editar
            </Link>
          ) : null}
          {user?.id != null && !terminated ? (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={handleTerminate}
              disabled={terminating}
            >
              {terminating ? 'Desativando…' : 'Desativar'}
            </button>
          ) : null}
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {user ? (
        <section className={styles.profileCard}>
          <div className={styles.profileGrid}>
            <div>
              <span className={styles.fieldLabel}>Nome</span>
              <p className={styles.fieldValue}>{user.name ?? '—'}</p>
            </div>
            <div>
              <span className={styles.fieldLabel}>CPF</span>
              <p className={styles.fieldValue}>{user.cpf ? formatCpf(user.cpf) : '—'}</p>
            </div>
            <div>
              <span className={styles.fieldLabel}>Papel</span>
              <p className={styles.fieldValue}>{user.roleName ?? '—'}</p>
            </div>
            <div>
              <span className={styles.fieldLabel}>Salário</span>
              <p className={styles.fieldValue}>
                {user.salary != null ? formatMoney(user.salary) : '—'}
              </p>
            </div>
            <div>
              <span className={styles.fieldLabel}>Nome fantasia</span>
              <p className={styles.fieldValue}>{user.fantasyName || '—'}</p>
            </div>
            <div>
              <span className={styles.fieldLabel}>Situação</span>
              <p
                className={`${styles.fieldValue} ${
                  terminated ? styles.statusTerminated : styles.statusActive
                }`}
              >
                {terminated ? `Desativado em ${user.terminatedAt}` : 'Ativo'}
              </p>
            </div>
            <div>
              <span className={styles.fieldLabel}>Ingresso</span>
              <p className={styles.fieldValue}>{user.ingressedAt ?? '—'}</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
