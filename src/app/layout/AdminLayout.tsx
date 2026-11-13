import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { brand } from '../../shared/brand'
import styles from './AdminLayout.module.css'

export function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isUsersSection = pathname.startsWith('/admin/usuarios')
  const isUsersListOrProfile =
    pathname === '/admin/usuarios' ||
    /^\/admin\/usuarios\/\d+(\/(editar|credenciais|referencias(\/.*)?)?)?$/.test(pathname)
  const isUsersCreate = pathname === '/admin/usuarios/novo'

  const isCategoriesSection = pathname.startsWith('/admin/categorias')
  const isCategoriesList = pathname === '/admin/categorias'
  const isCategoriesCreate = pathname === '/admin/categorias/nova'
  const isCategoriesEdit = /^\/admin\/categorias\/\d+\/editar$/.test(pathname)

  const isRolesSection = pathname.startsWith('/admin/papeis')
  const isRolesList = pathname === '/admin/papeis'
  const isRolesCreate = pathname === '/admin/papeis/novo'
  const isRolesEdit = /^\/admin\/papeis\/\d+\/editar$/.test(pathname)

  const isGoalsSection = pathname.startsWith('/admin/metas')
  const isGoalsList = pathname === '/admin/metas'
  const isGoalsCreate = pathname === '/admin/metas/nova'
  const isGoalsEdit = /^\/admin\/metas\/\d+\/editar$/.test(pathname)

  const isRestaurantsSection = pathname.startsWith('/admin/restaurantes')
  const isRestaurantsList = pathname === '/admin/restaurantes'
  const isRestaurantsCreate = pathname === '/admin/restaurantes/novo'
  const isRestaurantsEdit = /^\/admin\/restaurantes\/\d+\/editar$/.test(pathname)

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
        <nav className={styles.nav} aria-label="Usuários">
          <NavLink
            to="/admin/usuarios"
            end
            className={() =>
              isUsersSection && isUsersListOrProfile ? styles.navActive : styles.navLink
            }
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

        <p className={styles.sectionLabel}>Categorias</p>
        <nav className={styles.nav} aria-label="Categorias">
          <NavLink
            to="/admin/categorias"
            end
            className={() =>
              isCategoriesSection && (isCategoriesList || isCategoriesEdit)
                ? styles.navActive
                : styles.navLink
            }
          >
            Listagem
          </NavLink>
          <NavLink
            to="/admin/categorias/nova"
            className={() => (isCategoriesCreate ? styles.navActive : styles.navLink)}
          >
            Cadastro
          </NavLink>
        </nav>

        <p className={styles.sectionLabel}>Papéis</p>
        <nav className={styles.nav} aria-label="Papéis">
          <NavLink
            to="/admin/papeis"
            end
            className={() =>
              isRolesSection && (isRolesList || isRolesEdit) ? styles.navActive : styles.navLink
            }
          >
            Listagem
          </NavLink>
          <NavLink
            to="/admin/papeis/novo"
            className={() => (isRolesCreate ? styles.navActive : styles.navLink)}
          >
            Cadastro
          </NavLink>
        </nav>

        <p className={styles.sectionLabel}>Metas</p>
        <nav className={styles.nav} aria-label="Metas">
          <NavLink
            to="/admin/metas"
            end
            className={() =>
              isGoalsSection && (isGoalsList || isGoalsEdit) ? styles.navActive : styles.navLink
            }
          >
            Listagem
          </NavLink>
          <NavLink
            to="/admin/metas/nova"
            className={() => (isGoalsCreate ? styles.navActive : styles.navLink)}
          >
            Cadastro
          </NavLink>
        </nav>

        <p className={styles.sectionLabel}>Restaurantes</p>
        <nav className={styles.nav} aria-label="Restaurantes">
          <NavLink
            to="/admin/restaurantes"
            end
            className={() =>
              isRestaurantsSection && (isRestaurantsList || isRestaurantsEdit)
                ? styles.navActive
                : styles.navLink
            }
          >
            Listagem
          </NavLink>
          <NavLink
            to="/admin/restaurantes/novo"
            className={() => (isRestaurantsCreate ? styles.navActive : styles.navLink)}
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
