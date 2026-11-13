import { useState, type FormEvent } from 'react'
import type { RegisterRequest } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import styles from '../../shared/pages.module.css'

type CredentialsFormProps = {
  userId: number
  userLabel?: string | null
  submitLabel?: string
  /** Quando omitido, o formulário só valida e sinaliza que a API ainda não está ligada. */
  onSubmit?: (payload: RegisterRequest) => Promise<void>
}

export function CredentialsForm({
  userId,
  userLabel,
  submitLabel = 'Criar acesso',
  onSubmit,
}: CredentialsFormProps) {
  const notify = useNotify()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftOk, setDraftOk] = useState<RegisterRequest | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setDraftOk(null)

    const trimmedUsername = username.trim()
    if (!trimmedUsername || !password || !confirmPassword) {
      const message = 'Preencha usuário, senha e confirmação.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }
    if (password !== confirmPassword) {
      const message = 'A confirmação de senha não confere.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }
    if (password.length < 4) {
      const message = 'A senha deve ter ao menos 4 caracteres.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }

    const payload: RegisterRequest = {
      username: trimmedUsername,
      password,
      userId,
    }

    if (!onSubmit) {
      setDraftOk(payload)
      notify.info(
        'Desenho validado — o POST /auth/register será ligado no próximo passo.',
        'Credenciais',
      )
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(payload)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível criar o acesso.'
      setError(message)
      notify.error(message, 'Falha na operação')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} autoComplete="off">
      {userLabel ? (
        <p className={styles.muted}>
          Vinculando login ao perfil <strong>{userLabel}</strong> (userId {userId}).
        </p>
      ) : (
        <p className={styles.muted}>Vinculando login ao userId {userId}.</p>
      )}

      <div className={styles.grid}>
        <label className={styles.label}>
          Usuário
          <input
            className={styles.input}
            name="username"
            autoComplete="off"
            spellCheck={false}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>
        <span aria-hidden />
        <label className={styles.label}>
          Senha
          <input
            className={styles.input}
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          Confirmar senha
          <input
            className={styles.input}
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {draftOk ? (
        <p className={styles.success}>
          Formulário ok — payload pronto ({draftOk.username} → userId {draftOk.userId}). Fetch
          pendente.
        </p>
      ) : null}

      <button className={styles.submit} type="submit" disabled={submitting}>
        {submitting ? 'Salvando…' : submitLabel}
      </button>
    </form>
  )
}
