import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { CategoryChips } from '../../features/catalog'
import { brand } from '../../shared/brand'
import { ThemeToggle } from '../../shared/theme'
import styles from './Navbar.module.css'

type NavbarProps = {
  categories?: string[]
  variant?: 'default' | 'landing'
}

export function Navbar({ categories = [], variant = 'default' }: NavbarProps) {
  const { isAuthenticated, isAdmin, isCook, username, logout } = useAuth()
  const navigate = useNavigate()
  const isLanding = variant === 'landing'
  const showCategories = !isLanding && categories.length > 0

  return (
    <header className={`${styles.header} ${isLanding ? styles.headerLanding : ''}`}>
      <div className={`${styles.top} ${isLanding ? styles.topLanding : ''}`}>
        <Link to="/" className={styles.brand}>
          <span>{brand.name}</span>
          {brand.tagline ? <span className={styles.brandTag}>{brand.tagline}</span> : null}
        </Link>
        <div className={styles.actions}>
          <ThemeToggle variant={isLanding ? 'onDark' : 'default'} />
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <Link to="/admin/usuarios" className={styles.adminLink}>
                  Admin
                </Link>
              ) : null}
              {isCook ? (
                <Link to="/cook/receitas" className={styles.adminLink}>
                  Minhas receitas
                </Link>
              ) : null}
              {isAdmin ? (
                <Link
                  to="/login"
                  className={styles.adminLink}
                  title="Sai da sessão admin e entre com cook/cook"
                  onClick={(event) => {
                    event.preventDefault()
                    logout()
                    navigate('/login')
                  }}
                >
                  Entrar como cozinheiro
                </Link>
              ) : null}
              {!isAdmin && !isCook ? (
                <Link
                  to="/login"
                  className={styles.adminLink}
                  title="Use cook/cook no modo demo"
                  onClick={(event) => {
                    event.preventDefault()
                    logout()
                    navigate('/login')
                  }}
                >
                  Painel do cozinheiro
                </Link>
              ) : null}
              <span className={styles.session}>
                {username ? `${username}` : 'Sessão'}
                {isCook ? ' · cozinheiro' : isAdmin ? ' · admin' : ''}
              </span>
              <button
                type="button"
                className={styles.logout}
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                Sair
              </button>
            </>
          ) : (
            <Link to="/login" className={styles.login}>
              Login
            </Link>
          )}
        </div>
      </div>

      {showCategories ? <CategoryChips categories={categories} /> : null}
    </header>
  )
}
