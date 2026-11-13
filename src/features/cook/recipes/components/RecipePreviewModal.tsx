import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { formatIngredientLine } from '../lib/measurements'
import styles from './RecipePreviewModal.module.css'

export type RecipePreviewData = {
  name: string
  categoryName: string
  description: string
  preparationMethod: string
  portions: number
  preparationTime: number
  authorName: string | null
  imageUrl: string | null
  ingredients: Array<{
    amount: number
    measurementName: string
    ingredientName: string
  }>
}

type RecipePreviewModalProps = {
  open: boolean
  data: RecipePreviewData
  onClose: () => void
}

function splitPreparation(method: string): string[] {
  return method
    .split(/\n+|(?<=\.)\s+/)
    .map((step) => step.trim())
    .filter(Boolean)
}

export function RecipePreviewModal({ open, data, onClose }: RecipePreviewModalProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const title = data.name.trim() || 'Nome da receita'
  const category = data.categoryName.trim() || 'Categoria'
  const author = data.authorName?.trim() || 'você'
  const descriptionParagraphs = data.description
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
  const steps = splitPreparation(data.preparationMethod)
  const hasImage = Boolean(data.imageUrl)

  return createPortal(
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <h2 id={titleId}>Prévia da receita</h2>
            <p>Como a página pública deve aparecer para quem for ler.</p>
          </div>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose}>
            Fechar
          </button>
        </header>

        <div className={styles.body}>
          <figure
            className={styles.media}
            style={hasImage ? { backgroundImage: `url(${data.imageUrl})` } : undefined}
          >
            {!hasImage ? <span className={styles.mediaPlaceholder}>Imagem da receita</span> : null}
            <figcaption className={styles.mediaAuthor}>Criado por {author}</figcaption>
          </figure>

          <p className={styles.category}>{category}</p>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.metaRow}>
            {Number.isFinite(data.portions) && data.portions > 0 ? (
              <span>Porções: {data.portions}</span>
            ) : null}
            {Number.isFinite(data.preparationTime) && data.preparationTime >= 0 ? (
              <span>Duração: {data.preparationTime} minutos</span>
            ) : null}
          </p>

          <section className={styles.section}>
            <h3>Descrição</h3>
            {descriptionParagraphs.length > 0 ? (
              <div className={styles.description}>
                {descriptionParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>Sem descrição cadastrada.</p>
            )}
          </section>

          <section className={styles.section}>
            <h3>Ingredientes</h3>
            {data.ingredients.length > 0 ? (
              <ul className={styles.ingredientList}>
                {data.ingredients.map((ingredient, index) => (
                  <li key={`${ingredient.ingredientName}-${index}`}>
                    {formatIngredientLine(
                      ingredient.amount,
                      ingredient.measurementName,
                      ingredient.ingredientName,
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>Nenhum ingrediente na lista.</p>
            )}
          </section>

          <section className={styles.section}>
            <h3>Modo de preparo</h3>
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
              <p className={styles.empty}>Sem modo de preparo cadastrado.</p>
            )}
          </section>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.footerButton} onClick={onClose}>
            Voltar ao formulário
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
