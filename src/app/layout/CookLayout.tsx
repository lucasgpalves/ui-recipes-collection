import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { brand } from '../../shared/brand'
import styles from './AdminLayout.module.css'

export function CookLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isRecipesSection = pathname.startsWith('/cook/receitas')

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <Link to="/cook/receitas" className={styles.brand}>
            {brand.name}
          </Link>
          <span className={styles.badge}>Cook</span>
        </div>

        <nav className={styles.nav} aria-label="Cook">
          <NavLink
            to="/cook/receitas"
            className={() => (isRecipesSection ? styles.navActive : styles.navLink)}
          >
            Receitas
          </NavLink>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.siteLink}>
            Ver site
          </Link>
          <button
            type="button"
            className={styles.logout}
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Sair
          </button>
        </div>
      </aside>

      <div className={styles.content}>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
