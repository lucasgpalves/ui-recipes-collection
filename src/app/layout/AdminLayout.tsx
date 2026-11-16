import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { brand } from '../../shared/brand'
import { ThemeToggle } from '../../shared/theme'
import styles from './AdminLayout.module.css'

export function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isUsersSection = pathname.startsWith('/admin/usuarios')
  const isCategoriesSection = pathname.startsWith('/admin/categorias')
  const isRolesSection = pathname.startsWith('/admin/papeis')
  const isGoalsSection = pathname.startsWith('/admin/metas')
  const isRestaurantsSection = pathname.startsWith('/admin/restaurantes')

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <Link to="/admin/usuarios" className={styles.brand}>
            {brand.name}
          </Link>
          <span className={styles.badge}>Admin</span>
        </div>

        <nav className={styles.nav} aria-label="Admin">
          <NavLink
            to="/admin/usuarios"
            className={() => (isUsersSection ? styles.navActive : styles.navLink)}
          >
            Usuários
          </NavLink>
          <NavLink
            to="/admin/categorias"
            className={() => (isCategoriesSection ? styles.navActive : styles.navLink)}
          >
            Categorias
          </NavLink>
          <NavLink
            to="/admin/papeis"
            className={() => (isRolesSection ? styles.navActive : styles.navLink)}
          >
            Papéis
          </NavLink>
          <NavLink
            to="/admin/metas"
            className={() => (isGoalsSection ? styles.navActive : styles.navLink)}
          >
            Metas
          </NavLink>
          <NavLink
            to="/admin/restaurantes"
            className={() => (isRestaurantsSection ? styles.navActive : styles.navLink)}
          >
            Restaurantes
          </NavLink>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.footerMeta}>
            <Link to="/" className={styles.siteLink}>
              Ver site
            </Link>
            <ThemeToggle />
          </div>
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
