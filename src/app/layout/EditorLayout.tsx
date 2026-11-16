import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { brand } from '../../shared/brand'
import { ThemeToggle } from '../../shared/theme'
import styles from './AdminLayout.module.css'

export function EditorLayout() {
  const { logout, isAdmin, isEditor } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isIngredientsSection = pathname.startsWith('/editor/ingredientes')
  const isBooksSection = pathname.startsWith('/editor/livros')
  const isRecipesSection = pathname.startsWith('/editor/receitas')
  const showEditorNav = isEditor || !isAdmin

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <Link to={isEditor ? '/editor/ingredientes' : '/editor/receitas'} className={styles.brand}>
            {brand.name}
          </Link>
          <span className={styles.badge}>{isAdmin && !isEditor ? 'Admin' : 'Editor'}</span>
        </div>

        <nav className={styles.nav} aria-label="Editor">
          {showEditorNav ? (
            <>
              <NavLink
                to="/editor/ingredientes"
                className={() => (isIngredientsSection ? styles.navActive : styles.navLink)}
              >
                Ingredientes
              </NavLink>
              <NavLink
                to="/editor/livros"
                className={() => (isBooksSection ? styles.navActive : styles.navLink)}
              >
                Livros
              </NavLink>
            </>
          ) : null}
          <NavLink
            to="/editor/receitas"
            className={() => (isRecipesSection ? styles.navActive : styles.navLink)}
          >
            Receitas
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
