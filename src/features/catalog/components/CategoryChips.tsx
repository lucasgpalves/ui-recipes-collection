import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { NavLink } from 'react-router-dom'
import styles from './CategoryChips.module.css'

const DRAG_THRESHOLD_PX = 6

type CategoryChipsProps = {
  categories: string[]
}

export function CategoryChips({ categories }: CategoryChipsProps) {
  const railRef = useRef<HTMLElement>(null)
  const dragRef = useRef<{
    pointerId: number | null
    startX: number
    scrollLeft: number
    dragging: boolean
    moved: boolean
  }>({
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
    dragging: false,
    moved: false,
  })
  const [hint, setHint] = useState({ visible: false, progress: 0 })
  const [dragging, setDragging] = useState(false)

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
  }, [categories, updateHint])

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    const rail = railRef.current
    if (!rail || event.pointerType === 'touch') return
    // Só prepara drag; não captura nem bloqueia chips até passar o limiar.
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: rail.scrollLeft,
      dragging: false,
      moved: false,
    }
  }, [])

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const rail = railRef.current
    const drag = dragRef.current
    if (!rail || drag.pointerId !== event.pointerId) return

    const delta = event.clientX - drag.startX
    if (!drag.dragging) {
      if (Math.abs(delta) < DRAG_THRESHOLD_PX) return
      drag.dragging = true
      drag.moved = true
      rail.setPointerCapture(event.pointerId)
      setDragging(true)
    }

    event.preventDefault()
    rail.scrollLeft = drag.scrollLeft - delta
  }, [])

  const endDrag = useCallback((event: PointerEvent<HTMLElement>) => {
    const rail = railRef.current
    const drag = dragRef.current
    if (!rail || drag.pointerId !== event.pointerId) return

    if (drag.dragging && rail.hasPointerCapture(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId)
    }

    const wasMoved = drag.moved
    drag.pointerId = null
    drag.dragging = false
    setDragging(false)

    // Mantém moved até o click em capture para cancelar navegação após drag.
    if (wasMoved) {
      window.setTimeout(() => {
        drag.moved = false
      }, 0)
    }
  }, [])

  const onClickCapture = useCallback((event: MouseEvent<HTMLElement>) => {
    if (dragRef.current.moved) {
      event.preventDefault()
      event.stopPropagation()
      dragRef.current.moved = false
    }
  }, [])

  if (categories.length === 0) return null

  return (
    <div className={styles.block}>
      <nav
        ref={railRef}
        className={`${styles.rail} ${dragging ? styles.railDragging : ''}`}
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
          className={({ isActive }) => `${styles.chip} ${isActive ? styles.chipActive : ''}`}
        >
          Todas
        </NavLink>
        {categories.map((category) => (
          <NavLink
            key={category}
            to={`/categorias/${encodeURIComponent(category)}`}
            className={({ isActive }) => `${styles.chip} ${isActive ? styles.chipActive : ''}`}
          >
            {category}
          </NavLink>
        ))}
      </nav>

      <div className={`${styles.scrollHint} ${hint.visible ? styles.scrollHintVisible : ''}`} aria-hidden>
        <div className={styles.scrollHintTrack}>
          <div
            className={styles.scrollHintThumb}
            style={{ transform: `translateX(${hint.progress * 100}%)` }}
          />
        </div>
      </div>
    </div>
  )
}
