import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { recipeDownloadUrl } from '../../../shared/api/client'
import type { Recipe, Review } from '../../../shared/api/types'
import { env } from '../../../shared/config/env'
import { StarRating } from '../../../shared/ui/StarRating'
import statusStyles from '../../../shared/ui/status.module.css'
import { TasterReviewSection } from '../components/TasterReviewSection'
import { fetchRecipe, fetchReviews } from '../api/recipes'
import styles from './RecipeDetail.module.css'

function splitPreparation(method: string | null): string[] {
  if (!method) return []
  return method
    .split(/\n+|(?<=\.)\s+/)
    .map((step) => step.trim())
    .filter(Boolean)
}

function formatCreatedAt(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatIngredient(amount: number | null, measurement: string | null, name: string | null) {
  return [amount, measurement, name]
    .filter((part) => part !== null && part !== undefined && `${part}`.trim() !== '')
    .join(' ')
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
  const createdLabel = formatCreatedAt(recipe?.createdAt ?? null)
  const descriptionParagraphs = (recipe?.description ?? '')
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (loading) {
    return <p className={statusStyles.state}>Carregando receita…</p>
  }

  if (error || !recipe) {
    return (
      <p className={`${statusStyles.state} ${statusStyles.error}`}>
        {error ?? 'Receita não encontrada.'}
      </p>
    )
  }

  return (
    <div className={styles.page}>
      <Link to="/receitas" className={styles.back}>
        ← Voltar às receitas
      </Link>

      <div className={styles.layout}>
        <div className={styles.left}>
          <figure
            className={styles.media}
            style={
              recipe.imageUrl
                ? { backgroundImage: `url(${recipe.imageUrl})` }
                : undefined
            }
          >
            {createdLabel && <span className={styles.mediaDate}>{createdLabel}</span>}
            {recipe.userName && (
              <figcaption className={styles.mediaAuthor}>
                Criado por {recipe.userName}
              </figcaption>
            )}
          </figure>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Ingredientes</h2>
              {recipe.portions != null && (
                <p className={styles.sectionMeta}>
                  <span className={styles.metaIcon} aria-hidden>
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M8.5 13a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 19.5c0-2.6 2.5-4.5 6-4.5s6 1.9 6 4.5V20H2.5v-.5Zm11.2 0c.3-1.4 1.2-2.6 2.5-3.3.8-.4 1.7-.7 2.8-.7 2.8 0 5 1.6 5 4V20h-10.3v-.5Z" />
                    </svg>
                  </span>
                  Porções: {recipe.portions}
                </p>
              )}
            </div>
            {recipe.ingredients?.length ? (
              <ul className={styles.ingredientList}>
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={`${ingredient.ingredientName}-${index}`}>
                    {formatIngredient(
                      ingredient.amount,
                      ingredient.measurementName,
                      ingredient.ingredientName,
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={statusStyles.empty}>Sem ingredientes cadastrados.</p>
            )}
          </section>
        </div>

        <div className={styles.right}>
          <header className={styles.copyHeader}>
            <h1>{recipe.name ?? 'Nome da receita'}</h1>
            {averageRating != null && <StarRating value={averageRating} />}
          </header>

          <TasterReviewSection
            recipeId={recipeId}
            recipeUserId={recipe.userId}
            isPublished={recipe.isPublished}
            reviews={reviews}
            onReviewsChange={setReviews}
          />

          <section className={styles.section}>
            <h2>Descrição</h2>
            {descriptionParagraphs.length > 0 ? (
              <div className={styles.descriptionBlock}>
                {descriptionParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className={statusStyles.empty}>Sem descrição cadastrada.</p>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Modo de preparo</h2>
              {(recipe.preparationTime ?? recipe.durationMinutes) != null && (
                <p className={styles.sectionMeta}>
                  <span className={styles.metaIcon} aria-hidden>
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M9 2h6v2H9V2Zm1.5 4h3l.4 1.2A7 7 0 1 1 11 7.2L11.5 6ZM12 9a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-.8 2.2h1.6v3.3l2.2 1.3-.8 1.3-3-1.8V11.2Z" />
                    </svg>
                  </span>
                  Duração: {recipe.preparationTime ?? recipe.durationMinutes} minutos
                </p>
              )}
            </div>
            {steps.length > 0 ? (
              <ol className={styles.steps}>
                {steps.map((step, index) => (
                  <li key={`${index}-${step}`}>
                    <span className={styles.stepIndex}>{index + 1}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={statusStyles.empty}>Sem modo de preparo cadastrado.</p>
            )}
          </section>

          {recipe.id != null && !env.useDemoApi && (
            <div className={styles.actions}>
              <a className={styles.download} href={recipeDownloadUrl(recipe.id)}>
                Baixar PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
