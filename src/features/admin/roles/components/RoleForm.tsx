import { useState, type FormEvent } from 'react'
import type { RoleRequest } from '../../../../shared/api/types'
import styles from '../../shared/pages.module.css'

type RoleFormProps = {
  initial?: Partial<RoleRequest>
  submitLabel: string
  onSubmit: (payload: RoleRequest) => Promise<void>
}

const EMPTY: RoleRequest = {
  name: '',
  description: '',
}

export function RoleForm({ initial, submitLabel, onSubmit }: RoleFormProps) {
  const [form, setForm] = useState<RoleRequest>({ ...EMPTY, ...initial })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const name = form.name.trim().toUpperCase()
    if (!name) {
      setError('Informe o nome do papel.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        name,
        description: form.description?.trim() || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o papel.')
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
            placeholder="COOK"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value.toUpperCase() }))
            }
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
