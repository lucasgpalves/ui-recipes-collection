import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { UserResponse } from '../../../../shared/api/types'
import { fetchUserById } from '../api/users'
import { CredentialsForm } from '../components/CredentialsForm'
import styles from '../../shared/pages.module.css'

/**
 * Tela de desenho: formulário de credenciais no perfil.
 * Integração com POST /auth/register fica para o próximo passo.
 */
export function AdminUserCredentialsPage() {
  const { id } = useParams()
  const userId = Number(id)
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
        if (active) setError('Não foi possível carregar o perfil.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId])

  const terminated = Boolean(user?.terminatedAt)
  const profilePath = Number.isFinite(userId) ? `/admin/usuarios/${userId}` : '/admin/usuarios'

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Criar acesso</h1>
          <p>
            Define username e senha para o usuário já cadastrado (RegisterRequestDTO). A chamada à
            API será ligada em seguida.
          </p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/usuarios" className={styles.ghostButton}>
            Listagem
          </Link>
          <Link to={profilePath} className={styles.ghostButton}>
            Perfil
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {user && terminated ? (
        <p className={styles.error}>
          Este usuário está desativado. Não é possível criar credenciais por aqui.
        </p>
      ) : null}

      {user && !terminated && Number.isFinite(userId) && userId > 0 ? (
        <>
          <section className={styles.profileCard} aria-label="Resumo do perfil">
            <div className={styles.profileGrid}>
              <div>
                <span className={styles.fieldLabel}>Nome</span>
                <p className={styles.fieldValue}>{user.name ?? '—'}</p>
              </div>
              <div>
                <span className={styles.fieldLabel}>Papel</span>
                <p className={styles.fieldValue}>{user.roleName ?? '—'}</p>
              </div>
              <div>
                <span className={styles.fieldLabel}>userId</span>
                <p className={styles.fieldValue}>{user.id ?? userId}</p>
              </div>
              <div>
                <span className={styles.fieldLabel}>Situação</span>
                <p className={`${styles.fieldValue} ${styles.statusActive}`}>Ativo</p>
              </div>
            </div>
          </section>

          <CredentialsForm userId={user.id ?? userId} userLabel={user.name} />
        </>
      ) : null}
    </div>
  )
}
