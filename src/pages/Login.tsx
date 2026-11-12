import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { brand } from '../brand'
import styles from './Login.module.css'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && (err.status === 403 || err.status === 401)) {
        setError('Usuário ou senha inválidos.')
      } else {
        setError('Não foi possível entrar. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <aside className={styles.visual}>
        <p className={`${styles.visualBrand} fade-up`}>
          {brand.name}
          {brand.tagline ? <span className={styles.visualTag}> {brand.tagline}</span> : null}
        </p>
      </aside>
      <section className={styles.panel}>
        <div className={`${styles.card} fade-up`}>
          <h1>Login</h1>
          <p className={styles.subtitle}>Acesse com as credenciais da API</p>
          <form className={styles.form} onSubmit={onSubmit}>
            <label className={styles.label}>
              Usuário
              <input
                className={styles.input}
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>
            <label className={styles.label}>
              Senha
              <input
                className={styles.input}
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.submit} type="submit" disabled={submitting}>
              {submitting ? 'Entrando…' : 'Login'}
            </button>
          </form>
          <Link className={styles.homeLink} to="/">
            ← Voltar ao início
          </Link>
        </div>
      </section>
    </div>
  )
}
