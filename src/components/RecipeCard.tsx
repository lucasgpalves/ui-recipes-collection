import { Link } from 'react-router-dom'
import type { RecipeSummary } from '../api/types'
import styles from './RecipeCard.module.css'

type RecipeCardProps = {
  recipe: RecipeSummary
  tone?: 'gold' | 'brown'
}

export function RecipeCard({ recipe, tone = 'gold' }: RecipeCardProps) {
  if (recipe.id == null) {
    return null
  }

  const snippet = [recipe.categoryName, recipe.userName ? `por ${recipe.userName}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className={styles.card}>
      <div className={styles.media} aria-hidden />
      <div className={`${styles.body} ${tone === 'brown' ? styles.brown : styles.gold}`}>
        <h3 className={styles.title}>{recipe.name ?? 'Nome receita'}</h3>
        {snippet && <p className={styles.meta}>{snippet}</p>}
        <Link className={styles.link} to={`/receitas/${recipe.id}`}>
          Ver esta receita
        </Link>
      </div>
    </article>
  )
}
