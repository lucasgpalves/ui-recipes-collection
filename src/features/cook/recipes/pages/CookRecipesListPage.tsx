import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../auth'
import type { Recipe } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { fetchCookRecipes } from '../api/recipes'
import styles from '../../../admin/shared/pages.module.css'

export function CookRecipesListPage() {
  const { username, userId } = useAuth()
  const notify = useNotify()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  const loadRecipes = useCallback(async () => {
    if (!username && userId == null) {
      setRecipes([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setRecipes(await fetchCookRecipes({ username, userId }))
    } catch {
      notify.error('Não foi possível carregar suas receitas.', 'Falha ao carregar')
    } finally {
      setLoading(false)
    }
  }, [notify, username, userId])

  useEffect(() => {
    void loadRecipes()
  }, [loadRecipes])

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Minhas receitas</h1>
          <p>Receitas publicadas por você ({username}). Cadastre e edite pelo painel do cozinheiro.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/cook/receitas/nova" className={styles.primaryButton}>
            Nova receita
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {!loading && recipes.length === 0 ? (
        <p className={styles.muted}>
          Você ainda não cadastrou receitas. Use “Nova receita” para começar.
        </p>
      ) : null}

      {recipes.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Publicada</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr key={recipe.id ?? recipe.name}>
                  <td>
                    <strong>{recipe.name ?? '—'}</strong>
                    {recipe.description ? (
                      <div className={styles.muted}>{recipe.description}</div>
                    ) : null}
                  </td>
                  <td>{recipe.categoryName ?? '—'}</td>
                  <td>
                    <span
                      className={
                        recipe.isPublished ? styles.statusActive : styles.statusTerminated
                      }
                    >
                      {recipe.isPublished == null
                        ? '—'
                        : recipe.isPublished
                          ? 'Sim'
                          : 'Não'}
                    </span>
                  </td>
                  <td>
                    {recipe.id != null ? (
                      <div className={styles.rowActions}>
                        <Link
                          to={`/cook/receitas/${recipe.id}/editar`}
                          className={styles.linkButton}
                        >
                          Editar
                        </Link>
                      </div>
                    ) : (
                      <span className={styles.muted}>Sem id</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
