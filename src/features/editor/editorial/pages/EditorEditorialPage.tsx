import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../../../shared/api/client'
import { useNotify } from '../../../../shared/ui/notify'
import {
  fetchEditorialRecipes,
  type EditorialFilter,
  type EditorialRecipeSummary,
} from '../api/editorial'
import styles from '../../../admin/shared/pages.module.css'

export function EditorEditorialPage() {
  const notify = useNotify()
  const [recipes, setRecipes] = useState<EditorialRecipeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [onlyRated, setOnlyRated] = useState(false)
  const [onlyPublished, setOnlyPublished] = useState(false)
  const [chefName, setChefName] = useState('')
  const [q, setQ] = useState('')

  const loadRecipes = useCallback(
    async (filter: EditorialFilter = {}) => {
      setLoading(true)
      try {
        setRecipes(await fetchEditorialRecipes(filter))
      } catch (err) {
        if (err instanceof ApiError) {
          notify.error(err.message || `Falha ao carregar (status ${err.status}).`, 'Fila editorial')
        } else {
          notify.error('Não foi possível carregar a fila editorial.', 'Fila editorial')
        }
        setRecipes([])
      } finally {
        setLoading(false)
      }
    },
    [notify],
  )

  useEffect(() => {
    void loadRecipes()
  }, [loadRecipes])

  function handleFilter(event: FormEvent) {
    event.preventDefault()
    const filter: EditorialFilter = {}
    if (category.trim()) filter.category = category.trim()
    if (onlyRated) filter.isRated = true
    if (onlyPublished) filter.isPublished = true
    if (chefName.trim()) filter.chefName = chefName.trim()
    if (q.trim()) filter.q = q.trim()
    void loadRecipes(filter)
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Receitas</h1>
          <p>Fila editorial com filtros combináveis (`GET /recipes/editorial`).</p>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleFilter}>
        <div className={styles.grid}>
          <label className={styles.label}>
            Categoria
            <input
              className={styles.input}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </label>
          <label className={styles.label}>
            Chef
            <input
              className={styles.input}
              value={chefName}
              onChange={(event) => setChefName(event.target.value)}
            />
          </label>
          <label className={styles.label}>
            Busca
            <input
              className={styles.input}
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </label>
        </div>

        <label className={styles.label}>
          <span>
            <input
              type="checkbox"
              checked={onlyRated}
              onChange={(event) => setOnlyRated(event.target.checked)}
            />{' '}
            Somente avaliadas
          </span>
        </label>

        <label className={styles.label}>
          <span>
            <input
              type="checkbox"
              checked={onlyPublished}
              onChange={(event) => setOnlyPublished(event.target.checked)}
            />{' '}
            Somente publicadas
          </span>
        </label>

        <button type="submit" className={styles.submit}>
          Filtrar
        </button>
      </form>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {!loading && recipes.length === 0 ? (
        <p className={styles.muted}>Nenhuma receita na fila com esses filtros.</p>
      ) : null}

      {recipes.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Receita</th>
                <th>Chef</th>
                <th>Categoria</th>
                <th>Avaliada</th>
                <th>Publicada</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr key={recipe.id}>
                  <td>
                    <strong>{recipe.name ?? '—'}</strong>
                  </td>
                  <td>{recipe.chefName ?? recipe.userName ?? recipe.userId ?? '—'}</td>
                  <td>{recipe.categoryName ?? '—'}</td>
                  <td>{recipe.isRated ? 'Sim' : 'Não'}</td>
                  <td>{recipe.isPublished ? 'Sim' : 'Não'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
