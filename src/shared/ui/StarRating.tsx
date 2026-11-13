import styles from './StarRating.module.css'

type StarRatingProps = {
  value: number
  max?: number
  showValue?: boolean
}

export function StarRating({ value, max = 5, showValue = true }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(max, value))
  const filledCount = Math.round(clamped)

  return (
    <div className={styles.wrap} aria-label={`Avaliação ${clamped.toFixed(1)} de ${max}`}>
      <div className={styles.stars} aria-hidden>
        {Array.from({ length: max }, (_, index) => (
          <span
            key={index}
            className={`${styles.star} ${index < filledCount ? styles.filled : ''}`}
          >
            ★
          </span>
        ))}
      </div>
      {showValue && <span className={styles.value}>{clamped.toFixed(1)}</span>}
    </div>
  )
}
