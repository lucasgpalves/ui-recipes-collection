import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import { useNotify } from '../../../../shared/ui/notify'
import { createBook } from '../api/books'
import styles from '../../../admin/shared/pages.module.css'

function parseRecipeIds(raw: string): number[] {
  return raw
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part))
    .filter((id) => Number.isFinite(id) && id > 0)
}

export function EditorBookCreatePage() {
  const notify = useNotify()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [isbn, setIsbn] = useState('')
  const [description, setDescription] = useState('')
  const [recipesRaw, setRecipesRaw] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedIsbn = isbn.trim()
    const recipesId = parseRecipeIds(recipesRaw)

    if (!trimmedTitle || !trimmedIsbn) {
      notify.warning('Título e ISBN são obrigatórios.', 'Cadastro')
      return
    }
    if (recipesId.length === 0) {
      notify.warning('Informe ao menos um ID de receita.', 'Cadastro')
      return
    }

    setSubmitting(true)
    try {
      await createBook({
        title: trimmedTitle,
        isbn: trimmedIsbn,
        description: description.trim(),
        recipesId,
      })
      notify.success(`Livro "${trimmedTitle}" criado.`, 'Cadastro')
      navigate('/editor/livros', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        notify.error(err.message || `Falha ao cadastrar (status ${err.status}).`, 'Cadastro')
      } else {
        notify.error('Não foi possível criar o livro.', 'Cadastro')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Novo livro</h1>
          <p>Informe ISBN, título, descrição e os IDs das receitas.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/editor/livros" className={styles.ghostButton}>
            Voltar à listagem
          </Link>
        </div>
      </header>

      <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
        <label className={styles.label}>
          Título
          <input
            className={styles.input}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          ISBN
          <input
            className={styles.input}
            value={isbn}
            onChange={(event) => setIsbn(event.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          Descrição
          <textarea
            className={styles.input}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
          />
        </label>
        <label className={styles.label}>
          Receitas
          <input
            className={styles.input}
            value={recipesRaw}
            onChange={(event) => setRecipesRaw(event.target.value)}
            placeholder="IDs separados por vírgula (ex.: 2, 5)"
            required
          />
        </label>
        <button type="submit" className={styles.submit} disabled={submitting}>
          Criar livro
        </button>
      </form>
    </div>
  )
}
