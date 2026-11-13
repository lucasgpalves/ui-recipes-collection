import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { JobReferenceRequest, Restaurant, UserResponse } from '../../../../shared/api/types'
import { isValidIsoDate } from '../../../../shared/lib/dates'
import { useNotify } from '../../../../shared/ui/notify'
import { fetchUsers } from '../../users/api/users'
import { fetchAdminRestaurants } from '../../restaurants/api/restaurants'
import styles from '../../shared/pages.module.css'

type JobReferenceFormProps = {
  initial?: Partial<JobReferenceRequest>
  submitLabel: string
  onSubmit: (payload: JobReferenceRequest) => Promise<void>
  /** Quando definido, o cozinheiro vem do perfil aberto e não é selecionável. */
  fixedUserId?: number
  fixedUserLabel?: string
}

const EMPTY: JobReferenceRequest = {
  restaurantName: '',
  startsAt: '',
  endsAt: '',
  contactNumber: '',
  userId: 0,
}

export function JobReferenceForm({
  initial,
  submitLabel,
  onSubmit,
  fixedUserId,
  fixedUserLabel,
}: JobReferenceFormProps) {
  const notify = useNotify()
  const location = useLocation()
  const [form, setForm] = useState<JobReferenceRequest>({
    ...EMPTY,
    ...initial,
    ...(fixedUserId != null ? { userId: fixedUserId } : {}),
  })
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [cooks, setCooks] = useState<UserResponse[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const restaurantCreateHref = `/admin/restaurantes/novo?returnTo=${encodeURIComponent(
    `${location.pathname}${location.search}`,
  )}`

  useEffect(() => {
    let active = true
    setLoadingOptions(true)

    const load = fixedUserId != null
      ? fetchAdminRestaurants().then((restaurantList) => ({ restaurantList, users: [] as UserResponse[] }))
      : Promise.all([fetchAdminRestaurants(), fetchUsers()]).then(([restaurantList, users]) => ({
          restaurantList,
          users,
        }))

    load
      .then(({ restaurantList, users }) => {
        if (!active) return
        setRestaurants(restaurantList)
        const cookUsers = users.filter(
          (user) => user.roleName === 'COOK' && !user.terminatedAt && user.id != null,
        )
        setCooks(cookUsers)
        setForm((current) => {
          const next = { ...current }
          if (fixedUserId != null) {
            next.userId = fixedUserId
          }
          if (initial?.restaurantName) {
            next.restaurantName = initial.restaurantName
          } else if (!next.restaurantName && restaurantList[0]?.name) {
            next.restaurantName = restaurantList[0].name
          }
          if (!fixedUserId && !next.userId && cookUsers[0]?.id != null) {
            next.userId = cookUsers[0].id
          }
          return next
        })
      })
      .catch(() => {
        if (active) {
          setError(
            fixedUserId != null
              ? 'Não foi possível carregar restaurantes.'
              : 'Não foi possível carregar restaurantes ou cozinheiros.',
          )
        }
      })
      .finally(() => {
        if (active) setLoadingOptions(false)
      })
    return () => {
      active = false
    }
  }, [fixedUserId, initial?.restaurantName])

  function updateField<K extends keyof JobReferenceRequest>(key: K, value: JobReferenceRequest[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const restaurantName = form.restaurantName.trim()
    const startsAt = form.startsAt.trim()
    const endsAt = form.endsAt?.trim() ? form.endsAt.trim() : null
    const contactNumber = form.contactNumber.trim()
    const userId = Number(fixedUserId ?? form.userId)

    if (!restaurantName || !startsAt || !contactNumber || !userId) {
      const message =
        fixedUserId != null
          ? 'Preencha restaurante, início e contato.'
          : 'Preencha restaurante, cozinheiro, início e contato.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }
    if (!isValidIsoDate(startsAt)) {
      const message = 'Data de início inválida.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }
    if (endsAt && !isValidIsoDate(endsAt)) {
      const message = 'Data de término inválida.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }
    if (endsAt && endsAt < startsAt) {
      const message = 'O término deve ser igual ou posterior ao início.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }
    if (!/^[\d+\-() ]+$/.test(contactNumber)) {
      const message = 'Contato: use dígitos e caracteres + ( ) -.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }
    if (fixedUserId == null && !cooks.some((cook) => cook.id === userId)) {
      const message = 'Selecione um cozinheiro (COOK) válido.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }
    if (
      !restaurants.some(
        (item) => (item.name ?? '').toLowerCase() === restaurantName.toLowerCase(),
      )
    ) {
      const message = 'Selecione um restaurante cadastrado.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        restaurantName,
        startsAt,
        endsAt,
        contactNumber,
        userId,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível salvar a referência de emprego.'
      setError(message)
      notify.error(message, 'Falha na operação')
    } finally {
      setSubmitting(false)
    }
  }

  const optionsReady =
    restaurants.length > 0 && (fixedUserId != null || cooks.length > 0)

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {fixedUserId == null && !loadingOptions && cooks.length === 0 ? (
        <p className={styles.error}>
          Cadastre ao menos um usuário com papel COOK (ativo) antes de criar a referência.
        </p>
      ) : null}
      {!loadingOptions && restaurants.length === 0 ? (
        <p className={styles.error}>
          Cadastre ao menos um restaurante antes de criar a referência.{' '}
          <Link to={restaurantCreateHref} className={styles.inlineLink}>
            Cadastrar restaurante
          </Link>
        </p>
      ) : null}

      <div className={styles.grid}>
        <label className={styles.label}>
          Restaurante
          <select
            className={styles.input}
            name="restaurantName"
            value={form.restaurantName}
            onChange={(event) => updateField('restaurantName', event.target.value)}
            required
            disabled={loadingOptions || restaurants.length === 0}
          >
            {restaurants.length === 0 ? <option value="">Sem restaurantes</option> : null}
            {restaurants.map((restaurant) =>
              restaurant.name ? (
                <option key={restaurant.id ?? restaurant.name} value={restaurant.name}>
                  {restaurant.name}
                  {restaurant.city ? ` — ${restaurant.city}` : ''}
                </option>
              ) : null,
            )}
          </select>
          <span className={styles.muted}>
            Não encontrou?{' '}
            <Link to={restaurantCreateHref} className={styles.inlineLink}>
              Cadastrar restaurante
            </Link>
          </span>
        </label>
        {fixedUserId != null ? (
          <div className={styles.label}>
            Cozinheiro
            <p className={styles.fieldValue}>{fixedUserLabel ?? `Usuário #${fixedUserId}`}</p>
            <span className={styles.muted}>Vinculado ao perfil aberto.</span>
          </div>
        ) : (
          <label className={styles.label}>
            Cozinheiro
            <select
              className={styles.input}
              name="userId"
              value={form.userId || ''}
              onChange={(event) => updateField('userId', Number(event.target.value))}
              required
              disabled={loadingOptions || cooks.length === 0}
            >
              {cooks.length === 0 ? <option value="">Sem cozinheiros</option> : null}
              {cooks.map((cook) => (
                <option key={cook.id!} value={cook.id!}>
                  {cook.name}
                  {cook.fantasyName ? ` (${cook.fantasyName})` : ''}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={styles.label}>
          Início
          <input
            className={styles.input}
            type="date"
            name="startsAt"
            value={form.startsAt}
            onChange={(event) => updateField('startsAt', event.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          Término
          <input
            className={styles.input}
            type="date"
            name="endsAt"
            value={form.endsAt ?? ''}
            onChange={(event) => updateField('endsAt', event.target.value)}
          />
          <span className={styles.muted}>Deixe vazio para vínculo em aberto.</span>
        </label>
        <label className={styles.label}>
          Contato
          <input
            className={styles.input}
            name="contactNumber"
            inputMode="tel"
            placeholder="Ex.: 61999999999"
            value={form.contactNumber}
            onChange={(event) => updateField('contactNumber', event.target.value)}
            required
          />
        </label>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <button
        className={styles.submit}
        type="submit"
        disabled={submitting || loadingOptions || !optionsReady}
      >
        {submitting ? 'Salvando…' : submitLabel}
      </button>
    </form>
  )
}
