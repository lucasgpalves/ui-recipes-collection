import { useMemo, useState, type FormEvent } from 'react'
import { useOptionalAuth } from '../../auth'
import { ApiError } from '../../../shared/api/client'
import type { Review } from '../../../shared/api/types'
import { useConfirm } from '../../../shared/ui/confirm'
import { useNotify } from '../../../shared/ui/notify'
import { StarRating } from '../../../shared/ui/StarRating'
import { createReview, deleteReview, fetchReviews, updateReview } from '../api/recipes'
import styles from './TasterReviewSection.module.css'

type TasterReviewSectionProps = {
  recipeId: number
  recipeUserId?: number | null
  isPublished: boolean | null
  reviews: Review[]
  onReviewsChange: (reviews: Review[]) => void
}

type ActiveSession = {
  userId: number | null
}

function parseRating(raw: string): number | null {
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const value = Number(trimmed)
  if (!Number.isInteger(value) || value < 1 || value > 5) return null
  return value
}

function canShowTasterForm(
  auth: ReturnType<typeof useOptionalAuth>,
  isPublished: boolean | null,
  recipeUserId?: number | null,
): auth is NonNullable<ReturnType<typeof useOptionalAuth>> {
  if (!auth?.isAuthenticated || auth.role !== 'TASTER' || isPublished !== true) {
    return false
  }
  if (recipeUserId != null && auth.userId != null && recipeUserId === auth.userId) {
    return false
  }
  return true
}

export function TasterReviewSection(props: TasterReviewSectionProps) {
  const auth = useOptionalAuth()
  if (!canShowTasterForm(auth, props.isPublished, props.recipeUserId)) {
    return null
  }
  return <TasterReviewPanel {...props} session={{ userId: auth.userId }} />
}

function TasterReviewPanel({
  recipeId,
  reviews,
  onReviewsChange,
  session,
}: TasterReviewSectionProps & { session: ActiveSession }) {
  const notify = useNotify()
  const { confirm } = useConfirm()
  const { userId } = session

  const [editing, setEditing] = useState(false)
  const [ratingInput, setRatingInput] = useState('5')
  const [descriptionInput, setDescriptionInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const ownReview = useMemo(() => {
    if (userId == null) return null
    return reviews.find((review) => review.userId === userId) ?? null
  }, [reviews, userId])

  async function reloadReviews() {
    const all = await fetchReviews().catch(() => [] as Review[])
    onReviewsChange(all.filter((review) => review.recipeId === recipeId))
  }

  function openCreateDefaults() {
    setRatingInput('5')
    setDescriptionInput('')
    setEditing(false)
  }

  function openEdit() {
    if (!ownReview) return
    setRatingInput(String(ownReview.rating ?? 5))
    setDescriptionInput(ownReview.description ?? '')
    setEditing(true)
  }

  function validateLocal(): { rating: number; description: string } | null {
    const rating = parseRating(ratingInput)
    const description = descriptionInput.trim()
    if (rating == null) {
      notify.warning('Informe uma nota inteira entre 1 e 5.', 'Avaliação')
      return null
    }
    if (!description) {
      notify.warning('Informe uma descrição para a avaliação.', 'Avaliação')
      return null
    }
    return { rating, description }
  }

  function handleApiError(err: unknown) {
    if (err instanceof ApiError) {
      if (err.status === 422) {
        notify.warning(err.message || 'Dados inválidos (422).', 'Avaliação')
        return
      }
      notify.error(err.message || `Falha na avaliação (status ${err.status}).`, 'Avaliação')
      return
    }
    notify.error('Não foi possível salvar a avaliação.', 'Avaliação')
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    const payload = validateLocal()
    if (!payload) return

    setSubmitting(true)
    try {
      await createReview({
        rating: payload.rating,
        description: payload.description,
        recipeId,
      })
      await reloadReviews()
      openCreateDefaults()
      notify.success('Avaliação enviada.', 'Avaliação')
    } catch (err) {
      handleApiError(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault()
    if (ownReview?.id == null) {
      notify.error('Não foi possível identificar sua avaliação.', 'Avaliação')
      return
    }
    const payload = validateLocal()
    if (!payload) return

    setSubmitting(true)
    try {
      await updateReview(ownReview.id, {
        rating: payload.rating,
        description: payload.description,
      })
      await reloadReviews()
      setEditing(false)
      notify.success('Avaliação atualizada.', 'Avaliação')
    } catch (err) {
      handleApiError(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (ownReview?.id == null) {
      notify.error('Não foi possível identificar sua avaliação.', 'Avaliação')
      return
    }
    const confirmed = await confirm({
      title: 'Excluir avaliação',
      message: 'Excluir a sua avaliação desta receita? Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      tone: 'danger',
    })
    if (!confirmed) return

    setSubmitting(true)
    try {
      await deleteReview(ownReview.id)
      await reloadReviews()
      openCreateDefaults()
      notify.success('Avaliação excluída.', 'Avaliação')
    } catch (err) {
      handleApiError(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (ownReview && !editing) {
    return (
      <section className={styles.section} aria-labelledby="taster-own-review-heading">
        <h2 id="taster-own-review-heading" className={styles.heading}>
          Minha avaliação
        </h2>
        <div className={styles.ownBody}>
          {typeof ownReview.rating === 'number' ? (
            <StarRating value={ownReview.rating} />
          ) : null}
          {ownReview.description ? (
            <p className={styles.ownMeta}>{ownReview.description}</p>
          ) : null}
          <div className={styles.ownActions}>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={openEdit}
              disabled={submitting}
            >
              Editar
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => void handleDelete()}
              disabled={submitting}
            >
              Excluir
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section} aria-labelledby="taster-review-form-heading">
      <h2 id="taster-review-form-heading" className={styles.heading}>
        {ownReview ? 'Editar avaliação' : 'Avaliar receita'}
      </h2>
      <form
        className={styles.form}
        onSubmit={(event) => void (ownReview ? handleUpdate(event) : handleCreate(event))}
      >
        <label className={styles.label} htmlFor="taster-review-rating">
          Nota
        </label>
        <input
          id="taster-review-rating"
          className={styles.input}
          type="number"
          inputMode="numeric"
          step={1}
          value={ratingInput}
          onChange={(event) => setRatingInput(event.target.value)}
          disabled={submitting}
          aria-required
        />

        <label className={styles.label} htmlFor="taster-review-description">
          Descrição
        </label>
        <textarea
          id="taster-review-description"
          className={styles.textarea}
          value={descriptionInput}
          onChange={(event) => setDescriptionInput(event.target.value)}
          disabled={submitting}
          aria-required
        />

        <div className={styles.formActions}>
          <button type="submit" className={styles.primaryButton} disabled={submitting}>
            {ownReview ? 'Salvar avaliação' : 'Enviar avaliação'}
          </button>
          {ownReview ? (
            <button
              type="button"
              className={styles.ghostButton}
              disabled={submitting}
              onClick={() => setEditing(false)}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
    </section>
  )
}
