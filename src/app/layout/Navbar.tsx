import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { CategoryChips } from '../../features/catalog'
import { brand } from '../../shared/brand'
import styles from './Navbar.module.css'

type NavbarProps = {
  categories?: string[]
  variant?: 'default' | 'landing'
}

export function Navbar({ categories = [], variant = 'default' }: NavbarProps) {
  const { isAuthenticated, logout } = useAuth()
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
          {isAuthenticated ? (
            <>
              <span className={styles.session}>Sessão ativa</span>
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
