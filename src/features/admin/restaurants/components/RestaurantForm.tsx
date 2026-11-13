import { useEffect, useState, type FormEvent } from 'react'
import type { Category, RestaurantRequest } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { fetchAdminCategories } from '../../categories/api/categories'
import styles from '../../shared/pages.module.css'

type RestaurantFormProps = {
  initial?: Partial<RestaurantRequest>
  submitLabel: string
  onSubmit: (payload: RestaurantRequest) => Promise<void>
}

const EMPTY: RestaurantRequest = {
  name: '',
  city: '',
  address: '',
  restaurantType: '',
  cnpj: '',
  categoryId: 0,
}

export function RestaurantForm({ initial, submitLabel, onSubmit }: RestaurantFormProps) {
  const notify = useNotify()
  const [form, setForm] = useState<RestaurantRequest>({ ...EMPTY, ...initial })
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoadingCategories(true)
    fetchAdminCategories()
      .then((data) => {
        if (!active) return
        setCategories(data)
        setForm((current) =>
          current.categoryId || !data[0] ? current : { ...current, categoryId: data[0].id },
        )
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar as categorias.')
      })
      .finally(() => {
        if (active) setLoadingCategories(false)
      })
    return () => {
      active = false
    }
  }, [])

  function updateField<K extends keyof RestaurantRequest>(key: K, value: RestaurantRequest[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const name = form.name.trim()
    const city = form.city.trim()
    const address = form.address.trim()
    const restaurantType = form.restaurantType.trim()
    const categoryId = Number(form.categoryId)

    if (!name || !city || !address || !restaurantType) {
      const message = 'Preencha nome, cidade, endereço e tipo.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      const message = 'Selecione uma categoria válida.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }
    if (!categories.some((item) => item.id === categoryId)) {
      const message = 'Selecione uma categoria válida.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        name,
        city,
        address,
        restaurantType,
        cnpj: form.cnpj?.trim() || null,
        categoryId,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível salvar o restaurante.'
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
            onChange={(event) => updateField('name', event.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          Cidade
          <input
            className={styles.input}
            name="city"
            value={form.city}
            onChange={(event) => updateField('city', event.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          Endereço
          <input
            className={styles.input}
            name="address"
            value={form.address}
            onChange={(event) => updateField('address', event.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          Tipo
          <input
            className={styles.input}
            name="restaurantType"
            placeholder="Ex.: Contemporâneo"
            value={form.restaurantType}
            onChange={(event) => updateField('restaurantType', event.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          CNPJ
          <input
            className={styles.input}
            name="cnpj"
            inputMode="numeric"
            placeholder="Opcional"
            value={form.cnpj ?? ''}
            onChange={(event) => updateField('cnpj', event.target.value)}
          />
        </label>
        <label className={styles.label}>
          Categoria
          <select
            className={styles.input}
            name="categoryId"
            value={form.categoryId || ''}
            onChange={(event) => updateField('categoryId', Number(event.target.value))}
            required
            disabled={loadingCategories || categories.length === 0}
          >
            {categories.length === 0 ? <option value="">Carregando…</option> : null}
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <button
        className={styles.submit}
        type="submit"
        disabled={submitting || loadingCategories || categories.length === 0}
      >
        {submitting ? 'Salvando…' : submitLabel}
      </button>
    </form>
  )
}
