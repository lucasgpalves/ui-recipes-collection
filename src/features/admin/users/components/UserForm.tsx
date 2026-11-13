import { useEffect, useState, type FormEvent } from 'react'
import { digitsOnlyCpf, formatCpf, isValidCpf } from '../../../../shared/lib/cpf'
import { formatMoney, parseMoneyInput } from '../../../../shared/lib/money'
import type { Role, UserRequest } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { fetchRoles } from '../../roles'
import styles from '../../shared/pages.module.css'

type UserFormProps = {
  initial?: Partial<UserRequest>
  submitLabel: string
  onSubmit: (payload: UserRequest) => Promise<void>
}

const EMPTY: UserRequest = {
  cpf: '',
  name: '',
  roleName: '',
  salary: 0,
  fantasyName: '',
  restaurantName: '',
}

export function UserForm({ initial, submitLabel, onSubmit }: UserFormProps) {
  const notify = useNotify()
  const [form, setForm] = useState<UserRequest>({ ...EMPTY, ...initial })
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

  function updateField<K extends keyof UserRequest>(key: K, value: UserRequest[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const cpf = digitsOnlyCpf(form.cpf)
    const name = form.name.trim()
    const roleName = String(form.roleName).trim().toUpperCase()
    const salary = Number(form.salary)

    if (!name || !roleName) {
      setError('Preencha CPF, nome e papel.')
      notify.warning('Preencha CPF, nome e papel.', 'Validação')
      return
    }
    if (!isValidCpf(cpf)) {
      setError('CPF inválido.')
      notify.warning('CPF inválido.', 'Validação')
      return
    }
    if (Number.isNaN(salary) || salary < 0) {
      setError('Salário deve ser um número maior ou igual a zero.')
      notify.warning('Salário deve ser maior ou igual a zero.', 'Validação')
      return
    }
    if (!roles.some((role) => role.name === roleName)) {
      setError('Selecione um papel válido.')
      notify.warning('Selecione um papel válido.', 'Validação')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        cpf,
        name,
        roleName,
        salary,
        fantasyName: form.fantasyName?.trim() || null,
        restaurantName: form.restaurantName?.trim() || null,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível salvar o usuário.'
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
          CPF
          <input
            className={styles.input}
            name="cpf"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            maxLength={14}
            value={formatCpf(form.cpf)}
            onChange={(event) => updateField('cpf', digitsOnlyCpf(event.target.value))}
            required
          />
        </label>
        <label className={styles.label}>
          Nome
          <input
            className={styles.input}
            name="name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          Papel
          <select
            className={styles.input}
            name="roleName"
            value={form.roleName}
            onChange={(event) => updateField('roleName', event.target.value)}
            required
            disabled={loadingRoles || roles.length === 0}
          >
            {roles.length === 0 ? <option value="">Carregando…</option> : null}
            {roles.map((role) =>
              role.name ? (
                <option key={role.name} value={role.name}>
                  {role.name}
                  {role.description ? ` — ${role.description}` : ''}
                </option>
              ) : null,
            )}
          </select>
        </label>
        <label className={styles.label}>
          Salário
          <input
            className={styles.input}
            name="salary"
            inputMode="numeric"
            autoComplete="off"
            placeholder="R$ 0,00"
            value={formatMoney(form.salary)}
            onChange={(event) => updateField('salary', parseMoneyInput(event.target.value))}
            required
          />
        </label>
        <label className={styles.label}>
          Nome fantasia
          <input
            className={styles.input}
            name="fantasyName"
            value={form.fantasyName ?? ''}
            onChange={(event) => updateField('fantasyName', event.target.value)}
          />
        </label>
        <label className={styles.label}>
          Restaurante
          <input
            className={styles.input}
            name="restaurantName"
            value={form.restaurantName ?? ''}
            onChange={(event) => updateField('restaurantName', event.target.value)}
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
