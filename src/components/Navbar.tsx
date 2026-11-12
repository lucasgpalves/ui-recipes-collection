import { Fragment } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { brand } from '../brand'
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

      {showCategories && (
        <nav className={styles.categories} aria-label="Categorias">
          {categories.map((category, index) => (
            <Fragment key={category}>
              {index > 0 && <span className={styles.divider} aria-hidden />}
              <NavLink
                to={`/categorias/${encodeURIComponent(category)}`}
                className={({ isActive }) =>
                  `${styles.category} ${isActive ? styles.categoryActive : ''}`
                }
              >
                {category}
              </NavLink>
            </Fragment>
          ))}
        </nav>
      )}
    </header>
  )
}
