import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { RecipeSummary } from '../../../shared/api/types'
import styles from './RecipeCard.module.css'

type RecipeCardProps = {
  recipe: RecipeSummary
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [imageFailed, setImageFailed] = useState(false)

  if (recipe.id == null) {
    return null
  }

  const snippet = [
    recipe.categoryName,
    recipe.userName ? `por ${recipe.userName}` : null,
    recipe.description,
  ]
    .filter(Boolean)
    .join(' · ')

  const showImage = Boolean(recipe.imageUrl) && !imageFailed
  const title = recipe.name ?? 'Nome receita'

  return (
    <Link
      className={styles.card}
      to={`/receitas/${recipe.id}`}
      aria-label={`Ver receita ${title}`}
    >
      <div className={`${styles.media} ${showImage ? '' : styles.mediaFallback}`}>
        {showImage && (
          <img
            className={styles.mediaImage}
            src={recipe.imageUrl!}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        {snippet && <p className={styles.meta}>{snippet}</p>}
        <span className={styles.link}>Ver esta receita</span>
      </div>
    </Link>
  )
}
