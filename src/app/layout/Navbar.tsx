import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth'
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
  const railRef = useRef<HTMLElement>(null)
  const dragRef = useRef<{ active: boolean; startX: number; scrollLeft: number; moved: boolean }>({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  })
  const [hint, setHint] = useState({ visible: false, progress: 0 })

  const updateHint = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    const maxScroll = rail.scrollWidth - rail.clientWidth
    if (maxScroll <= 2) {
      setHint({ visible: false, progress: 0 })
      return
    }
    setHint({
      visible: true,
      progress: Math.min(1, Math.max(0, rail.scrollLeft / maxScroll)),
    })
  }, [])

  useEffect(() => {
    if (!showCategories) return
    const rail = railRef.current
    if (!rail) return

    updateHint()
    rail.addEventListener('scroll', updateHint, { passive: true })
    const observer = new ResizeObserver(updateHint)
    observer.observe(rail)
    window.addEventListener('resize', updateHint)

    return () => {
      rail.removeEventListener('scroll', updateHint)
      observer.disconnect()
      window.removeEventListener('resize', updateHint)
    }
  }, [showCategories, categories, updateHint])

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    const rail = railRef.current
    if (!rail || event.pointerType === 'touch') return
    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: rail.scrollLeft,
      moved: false,
    }
    rail.setPointerCapture(event.pointerId)
    rail.classList.add(styles.categoriesDragging)
  }, [])

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const rail = railRef.current
    const drag = dragRef.current
    if (!rail || !drag.active) return
    const delta = event.clientX - drag.startX
    if (Math.abs(delta) > 4) drag.moved = true
    rail.scrollLeft = drag.scrollLeft - delta
  }, [])

  const endDrag = useCallback((event: PointerEvent<HTMLElement>) => {
    const rail = railRef.current
    const drag = dragRef.current
    if (!rail || !drag.active) return
    drag.active = false
    rail.classList.remove(styles.categoriesDragging)
    if (rail.hasPointerCapture(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId)
    }
  }, [])

  const onClickCapture = useCallback((event: MouseEvent<HTMLElement>) => {
    if (dragRef.current.moved) {
      event.preventDefault()
      event.stopPropagation()
      dragRef.current.moved = false
    }
  }, [])

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
        <div className={styles.categoriesBlock}>
          <nav
            ref={railRef}
            className={styles.categories}
            aria-label="Categorias"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={onClickCapture}
          >
            <NavLink
              to="/receitas"
              end
              className={({ isActive }) =>
                `${styles.chip} ${isActive ? styles.chipActive : ''}`
              }
            >
              Todas
            </NavLink>
            {categories.map((category) => (
              <NavLink
                key={category}
                to={`/categorias/${encodeURIComponent(category)}`}
                className={({ isActive }) =>
                  `${styles.chip} ${isActive ? styles.chipActive : ''}`
                }
              >
                {category}
              </NavLink>
            ))}
          </nav>

          <div
            className={`${styles.scrollHint} ${hint.visible ? styles.scrollHintVisible : ''}`}
            aria-hidden
          >
            <div className={styles.scrollHintTrack}>
              <div
                className={styles.scrollHintThumb}
                style={{ transform: `translateX(${hint.progress * 100}%)` }}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
