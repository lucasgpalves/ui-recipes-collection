import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './SearchBar.module.css'

type SearchBarProps = {
  initialQuery?: string
  className?: string
}

export function SearchBar({ initialQuery = '', className }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const navigate = useNavigate()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) {
      navigate('/receitas')
      return
    }
    navigate(`/receitas?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <form className={`${styles.form} ${className ?? ''}`.trim()} onSubmit={onSubmit} role="search">
      <input
        className={styles.input}
        type="search"
        name="q"
        placeholder="Buscar..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Buscar receitas"
      />
      <button className={styles.button} type="submit">
        Procurar
      </button>
    </form>
  )
}
