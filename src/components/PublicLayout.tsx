import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { fetchCategories } from '../api/recipes'
import { resolveNavCategories } from '../data/commonCategories'
import { Navbar } from './Navbar'
import styles from './PublicLayout.module.css'

export function PublicLayout() {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'
  const [apiCategories, setApiCategories] = useState<string[]>([])

  useEffect(() => {
    let active = true
    fetchCategories()
      .then((data) => {
        if (!active) return
        setApiCategories(
          data
            .map((category) => category.name)
            .filter((name): name is string => Boolean(name)),
        )
      })
      .catch(() => {
        if (active) setApiCategories([])
      })
    return () => {
      active = false
    }
  }, [])

  const categories = useMemo(() => resolveNavCategories(apiCategories), [apiCategories])

  return (
    <div className={`${styles.shell} ${isLanding ? styles.shellLanding : ''}`}>
      {!isLanding && <aside className={`${styles.side} ${styles.sideLeft}`} aria-hidden />}
      <div className={`${styles.column} ${isLanding ? styles.columnLanding : ''}`}>
        <Navbar categories={categories} variant={isLanding ? 'landing' : 'default'} />
        <main className={`${styles.main} ${isLanding ? styles.mainLanding : ''}`}>
          <Outlet context={{ categories }} />
        </main>
      </div>
      {!isLanding && <aside className={`${styles.side} ${styles.sideRight}`} aria-hidden />}
    </div>
  )
}
