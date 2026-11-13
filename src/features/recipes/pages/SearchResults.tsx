import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import type { RecipeSummary } from '../../../shared/api/types'
import { SearchBar } from '../../../shared/ui/SearchBar'
import statusStyles from '../../../shared/ui/status.module.css'
import { fetchRecipes } from '../api/recipes'
import { RecipeCard } from '../components/RecipeCard'
import styles from './SearchResults.module.css'

function matchesQuery(recipe: RecipeSummary, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [recipe.name, recipe.categoryName, recipe.userName]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(needle))
}

export function SearchResultsPage() {
  const { name } = useParams()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const categoryName = name ? decodeURIComponent(name) : null

  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchRecipes()
      .then((data) => {
        if (!active) return
        setRecipes(data)
        setError(null)
      })
      .catch(() => {
        if (!active) return
        setError('Não foi possível carregar as receitas.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    return recipes.filter((recipe) => {
      if (categoryName) {
        return (recipe.categoryName ?? '').toLowerCase() === categoryName.toLowerCase()
      }
      return matchesQuery(recipe, query)
    })
  }, [recipes, categoryName, query])

  const title = categoryName
    ? `Relacionados à ${categoryName}`
    : query
      ? `Resultados para “${query}”`
      : 'Receitas'

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{categoryName ? 'Categoria' : 'Busca'}</p>
        <h1>{title}</h1>
      </div>

      <div className={styles.searchBlock}>
        <SearchBar initialQuery={query} />
      </div>

      {loading && <p className={statusStyles.state}>Carregando…</p>}
      {error && <p className={`${statusStyles.state} ${statusStyles.error}`}>{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className={statusStyles.empty}>Nenhuma receita encontrada.</p>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className={styles.rail}>
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id ?? recipe.name} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
