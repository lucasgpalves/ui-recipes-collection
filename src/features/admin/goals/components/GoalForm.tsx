import { useEffect, useState, type FormEvent } from 'react'
import type { GoalRequest, Role } from '../../../../shared/api/types'
import { fetchRoles } from '../../roles'
import styles from '../../shared/pages.module.css'

type GoalFormProps = {
  initial?: Partial<GoalRequest>
  submitLabel: string
  onSubmit: (payload: GoalRequest) => Promise<void>
}

const EMPTY: GoalRequest = {
  title: '',
  amount: 1,
  description: '',
  roleName: '',
}

export function GoalForm({ initial, submitLabel, onSubmit }: GoalFormProps) {
  const [form, setForm] = useState<GoalRequest>({ ...EMPTY, ...initial })
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoadingRoles(true)
    fetchRoles()
      .then((data) => {
        if (!active) return
        setRoles(data)
        const firstRole = data.find((role) => role.name)?.name
        setForm((current) =>
          current.roleName || !firstRole ? current : { ...current, roleName: firstRole },
        )
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar os papéis.')
      })
      .finally(() => {
        if (active) setLoadingRoles(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const title = form.title.trim()
    const roleName = String(form.roleName).trim().toUpperCase()
    const amount = Number(form.amount)

    if (!title || !roleName) {
      setError('Preencha título e papel.')
      return
    }
    if (!Number.isInteger(amount) || amount < 1) {
      setError('A meta (amount) deve ser um inteiro maior ou igual a 1.')
      return
    }
    if (!roles.some((role) => role.name === roleName)) {
      setError('Selecione um papel válido.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        title,
        amount,
        roleName,
        description: form.description?.trim() || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a meta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label className={styles.label}>
          Título
          <input
            className={styles.input}
            name="title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            required
          />
        </label>
        <label className={styles.label}>
          Meta (quantidade)
          <input
            className={styles.input}
            name="amount"
            type="number"
            min={1}
            step={1}
            value={form.amount}
            onChange={(event) =>
              setForm((current) => ({ ...current, amount: Number(event.target.value) }))
            }
            required
          />
        </label>
        <label className={styles.label}>
          Papel
          <select
            className={styles.input}
            name="roleName"
            value={form.roleName}
            onChange={(event) =>
              setForm((current) => ({ ...current, roleName: event.target.value }))
            }
            required
            disabled={loadingRoles || roles.length === 0}
          >
            {roles.length === 0 ? <option value="">Carregando…</option> : null}
            {roles.map((role) =>
              role.name ? (
                <option key={role.id ?? role.name} value={role.name}>
                  {role.name}
                  {role.description ? ` — ${role.description}` : ''}
                </option>
              ) : null,
            )}
          </select>
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

      <button
        className={styles.submit}
        type="submit"
        disabled={submitting || loadingRoles || roles.length === 0}
      >
        {submitting ? 'Salvando…' : submitLabel}
      </button>
    </form>
  )
}
