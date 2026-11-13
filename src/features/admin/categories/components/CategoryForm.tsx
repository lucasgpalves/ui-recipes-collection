import { useState, type FormEvent } from 'react'
import type { CategoryRequest } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import styles from '../../shared/pages.module.css'

type CategoryFormProps = {
  initial?: Partial<CategoryRequest>
  submitLabel: string
  onSubmit: (payload: CategoryRequest) => Promise<void>
}

const EMPTY: CategoryRequest = {
  name: '',
  description: '',
}

export function CategoryForm({ initial, submitLabel, onSubmit }: CategoryFormProps) {
  const notify = useNotify()
  const [form, setForm] = useState<CategoryRequest>({ ...EMPTY, ...initial })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const name = form.name.trim()
    if (!name) {
      setError('Informe o nome da categoria.')
      notify.warning('Informe o nome da categoria.', 'Validação')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        name,
        description: form.description?.trim() || null,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível salvar a categoria.'
      setError(message)
      notify.error(message, 'Falha na operação')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label className={styles.label}>
          Nome
          <input
            className={styles.input}
            name="name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </label>
        <label className={styles.label}>
          Descrição
          <input
            className={styles.input}
            name="description"
            value={form.description ?? ''}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
          />
        </label>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <button className={styles.submit} type="submit" disabled={submitting}>
        {submitting ? 'Salvando…' : submitLabel}
      </button>
    </form>
  )
}
