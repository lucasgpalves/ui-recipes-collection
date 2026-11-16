import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotify } from '../../../../shared/ui/notify'
import { fetchEditorBooks, type EditorBook } from '../api/books'
import styles from '../../../admin/shared/pages.module.css'

export function EditorBooksListPage() {
  const notify = useNotify()
  const [books, setBooks] = useState<EditorBook[]>([])
  const [loading, setLoading] = useState(true)

  const loadBooks = useCallback(async () => {
    setLoading(true)
    try {
      setBooks(await fetchEditorBooks())
    } catch {
      notify.error('Não foi possível carregar os livros.', 'Falha ao carregar')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    void loadBooks()
  }, [loadBooks])

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Livros</h1>
          <p>Crie livros e publique quando os critérios da API forem atendidos.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/editor/livros/novo" className={styles.primaryButton}>
            Novo livro
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {!loading && books.length === 0 ? (
        <p className={styles.muted}>Nenhum livro cadastrado ainda.</p>
      ) : null}

      {books.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>ISBN</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td>
                    <strong>{book.title}</strong>
                  </td>
                  <td>{book.isbn ?? '—'}</td>
                  <td>
                    <span className={book.isPublished ? styles.statusActive : styles.muted}>
                      {book.isPublished ? 'Publicado' : 'Rascunho'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/editor/livros/${book.id}`} className={styles.linkButton}>
                      Detalhe
                    </Link>
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
