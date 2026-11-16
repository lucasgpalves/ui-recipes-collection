import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import { useNotify } from '../../../../shared/ui/notify'
import { fetchBookById, publishBook, type EditorBook } from '../api/books'
import styles from '../../../admin/shared/pages.module.css'

export function EditorBookDetailPage() {
  const { id } = useParams()
  const bookId = Number(id)
  const notify = useNotify()
  const [book, setBook] = useState<EditorBook | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [publishErrors, setPublishErrors] = useState<string[]>([])

  const loadBook = useCallback(async () => {
    if (!Number.isFinite(bookId) || bookId <= 0) {
      setBook(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setBook(await fetchBookById(bookId))
      setPublishErrors([])
    } catch {
      notify.error('Não foi possível carregar o livro.', 'Livro')
      setBook(null)
    } finally {
      setLoading(false)
    }
  }, [bookId, notify])

  useEffect(() => {
    void loadBook()
  }, [loadBook])

  async function handlePublish() {
    if (!book) return
    setPublishing(true)
    setPublishErrors([])
    try {
      await publishBook(book.id)
      setBook(await fetchBookById(book.id))
      notify.success('Publicação concluída.', 'Sucesso')
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message || `Falha ao publicar (status ${err.status}).`
          : 'Não foi possível publicar o livro.'
      const reasons = message
        .split(/; |\n/)
        .map((part) => part.trim())
        .filter(Boolean)
      setPublishErrors(reasons.length > 0 ? reasons : [message])
      notify.error('Não foi possível publicar o livro.', 'Publicação')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>{book?.title ?? (loading ? 'Carregando…' : 'Livro')}</h1>
          <p>Detalhe e publicação do livro editorial.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/editor/livros" className={styles.ghostButton}>
            Voltar à listagem
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {!loading && !book ? <p className={styles.muted}>Livro não encontrado.</p> : null}

      {book ? (
        <section className={styles.profileCard} aria-label="Detalhe do livro">
          <div className={styles.profileGrid}>
            <div>
              <span className={styles.fieldLabel}>ISBN</span>
              <p className={styles.fieldValue}>{book.isbn ?? '—'}</p>
            </div>
            <div>
              <span className={styles.fieldLabel}>Status</span>
              <p
                className={`${styles.fieldValue} ${
                  book.isPublished ? styles.statusActive : styles.muted
                }`}
              >
                {book.isPublished ? 'Publicado' : 'Rascunho'}
              </p>
            </div>
          </div>

          {book.description ? (
            <div>
              <span className={styles.fieldLabel}>Descrição</span>
              <p className={styles.fieldValue}>{book.description}</p>
            </div>
          ) : null}

          {!book.isPublished ? (
            <button
              type="button"
              className={styles.submit}
              disabled={publishing}
              onClick={() => void handlePublish()}
            >
              Publicar
            </button>
          ) : null}

          {publishErrors.length > 0 ? (
            <div className={styles.error} role="alert">
              <p>Não foi possível publicar:</p>
              <ul>
                {publishErrors.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
