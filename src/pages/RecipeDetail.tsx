import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { recipeDownloadUrl } from '../api/client'
import { fetchRecipe, fetchReviews } from '../api/recipes'
import type { Recipe, Review } from '../api/types'
import layoutStyles from '../components/PublicLayout.module.css'
import styles from './RecipeDetail.module.css'

function splitPreparation(method: string | null): string[] {
  if (!method) return []
  return method
    .split(/\n+|(?<=\.)\s+/)
    .map((step) => step.trim())
    .filter(Boolean)
}

export function RecipeDetailPage() {
  const { id } = useParams()
  const recipeId = Number(id)

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(recipeId)) {
      setError('Receita inválida.')
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    Promise.all([fetchRecipe(recipeId), fetchReviews().catch(() => [] as Review[])])
      .then(([recipeData, reviewData]) => {
        if (!active) return
        setRecipe(recipeData)
        setReviews(reviewData.filter((review) => review.recipeId === recipeId))
        setError(null)
      })
      .catch(() => {
        if (!active) return
        setError('Não foi possível carregar esta receita.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [recipeId])

  const averageRating = useMemo(() => {
    const ratings = reviews
      .map((review) => review.rating)
      .filter((rating): rating is number => typeof rating === 'number')
    if (ratings.length === 0) return null
    return ratings.reduce((sum, value) => sum + value, 0) / ratings.length
  }, [reviews])

  const steps = splitPreparation(recipe?.preparationMethod ?? null)

  if (loading) {
    return <p className={layoutStyles.state}>Carregando receita…</p>
  }

  if (error || !recipe) {
    return <p className={`${layoutStyles.state} ${layoutStyles.error}`}>{error ?? 'Receita não encontrada.'}</p>
  }

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>
        ← Voltar
      </Link>

      <section className={styles.hero}>
        <div className={styles.media} aria-hidden />
        <div className={styles.copy}>
          <h1>{recipe.name ?? 'Receita'}</h1>
          <div className={styles.meta}>
            {recipe.categoryName && <span>{recipe.categoryName}</span>}
            {recipe.userName && <span>por {recipe.userName}</span>}
            {averageRating != null && (
              <span className={styles.rating}>{averageRating.toFixed(1)} ★</span>
            )}
          </div>
          {recipe.description && <p className={styles.description}>{recipe.description}</p>}
          {recipe.id != null && (
            <div className={styles.actions}>
              <a className={styles.download} href={recipeDownloadUrl(recipe.id)}>
                Baixar PDF
              </a>
            </div>
          )}
        </div>
      </section>

      <section className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Ingredientes</h2>
            {recipe.portions != null && (
              <span className={styles.badge}>{recipe.portions} porções</span>
            )}
          </div>
          {recipe.ingredients?.length ? (
            <ul className={styles.list}>
              {recipe.ingredients.map((ingredient, index) => (
                <li key={`${ingredient.ingredientName}-${index}`}>
                  {[ingredient.amount, ingredient.measurementName, ingredient.ingredientName]
                    .filter((part) => part !== null && part !== undefined && `${part}`.trim() !== '')
                    .join(' ')}
                </li>
              ))}
            </ul>
          ) : (
            <p className={layoutStyles.empty}>Sem ingredientes cadastrados.</p>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Modo de preparo</h2>
          </div>
          {steps.length > 0 ? (
            <ol className={styles.steps}>
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : (
            <p className={layoutStyles.empty}>Sem modo de preparo cadastrado.</p>
          )}
        </div>
      </section>
    </div>
  )
}
