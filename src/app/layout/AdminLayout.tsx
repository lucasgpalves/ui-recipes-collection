import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { brand } from '../../shared/brand'
import styles from './AdminLayout.module.css'

export function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isUsersListOrProfile =
    pathname === '/admin/usuarios' || /^\/admin\/usuarios\/\d+(\/editar)?$/.test(pathname)
  const isUsersCreate = pathname === '/admin/usuarios/novo'

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <Link to="/admin/usuarios" className={styles.brand}>
            {brand.name}
          </Link>
          <span className={styles.badge}>Admin</span>
        </div>

        <p className={styles.sectionLabel}>Usuários</p>
        <nav className={styles.nav} aria-label="Administração">
          <NavLink
            to="/admin/usuarios"
            end
            className={() => (isUsersListOrProfile ? styles.navActive : styles.navLink)}
          >
            Listagem
          </NavLink>
          <NavLink
            to="/admin/usuarios/novo"
            className={() => (isUsersCreate ? styles.navActive : styles.navLink)}
          >
            Cadastro
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
