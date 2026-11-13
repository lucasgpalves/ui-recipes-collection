import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { DEMO_COOK_USER_ID } from '../../../../demo/demoApi'
import { fetchCategories } from '../../../catalog'
import type {
  Category,
  Recipe,
  RecipeIngredientRequest,
  RecipeRequest,
} from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import pageStyles from '../../../admin/shared/pages.module.css'
import {
  DEFAULT_MEASUREMENT,
  MEASUREMENT_OPTIONS,
  formatIngredientLine,
  normalizeMeasurement,
  type MeasurementValue,
} from '../lib/measurements'
import styles from './RecipeForm.module.css'

type RecipeFormProps = {
  initial?: Recipe | null
  submitLabel: string
  onSubmit: (payload: RecipeRequest) => Promise<void>
}

type DraftIngredient = {
  amount: number
  measurementName: MeasurementValue
  ingredientName: string
}

const EMPTY_DRAFT: DraftIngredient = {
  amount: 1,
  measurementName: DEFAULT_MEASUREMENT,
  ingredientName: '',
}

function ingredientsFromRecipe(recipe?: Recipe | null): RecipeIngredientRequest[] {
  if (!recipe?.ingredients?.length) return []
  return recipe.ingredients.map((item) => ({
    amount: item.amount ?? 1,
    ingredientName: item.ingredientName ?? '',
    measurementName: normalizeMeasurement(item.measurementName),
  }))
}

export function RecipeForm({ initial, submitLabel, onSubmit }: RecipeFormProps) {
  const notify = useNotify()
  const listHeadingId = useId()
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(initial?.name ?? '')
  const [categoryName, setCategoryName] = useState(initial?.categoryName ?? '')
  const [preparationMethod, setPreparationMethod] = useState(initial?.preparationMethod ?? '')
  const [portions, setPortions] = useState(initial?.portions ?? 1)
  const [preparationTime, setPreparationTime] = useState(initial?.durationMinutes ?? 30)
  const [description, setDescription] = useState(initial?.description ?? '')
  const [ingredients, setIngredients] = useState<RecipeIngredientRequest[]>(() =>
    ingredientsFromRecipe(initial),
  )
  const [draft, setDraft] = useState<DraftIngredient>(EMPTY_DRAFT)
  const [composerError, setComposerError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const draftPreview =
    draft.ingredientName.trim() && Number.isFinite(draft.amount) && draft.amount > 0
      ? formatIngredientLine(draft.amount, draft.measurementName, draft.ingredientName)
      : null

  useEffect(() => {
    let active = true
    setLoadingCategories(true)
    fetchCategories()
      .then((data) => {
        if (!active) return
        setCategories(data)
        const first = data.find((item) => item.name)?.name
        if (first) {
          setCategoryName((current) => current || first)
        }
      })
      .catch(() => {
        if (active) {
          setError('Não foi possível carregar as categorias.')
          notify.error('Não foi possível carregar as categorias.', 'Falha ao carregar')
        }
      })
      .finally(() => {
        if (active) setLoadingCategories(false)
      })
    return () => {
      active = false
    }
  }, [notify])

  function addIngredientFromDraft() {
    setComposerError(null)
    const ingredientName = draft.ingredientName.trim()
    const amount = Number(draft.amount)

    if (!ingredientName) {
      setComposerError('Informe o nome do ingrediente.')
      nameInputRef.current?.focus()
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setComposerError('Quantidade deve ser maior que zero.')
      return
    }

    const next: RecipeIngredientRequest = {
      amount,
      ingredientName,
      measurementName: draft.measurementName,
    }

    setIngredients((current) => [...current, next])
    setDraft({
      amount: 1,
      measurementName: draft.measurementName,
      ingredientName: '',
    })
    window.requestAnimationFrame(() => nameInputRef.current?.focus())
  }

  function handleDraftKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    addIngredientFromDraft()
  }

  function removeIngredient(index: number) {
    setIngredients((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setComposerError(null)

    const trimmedName = name.trim()
    const trimmedCategory = categoryName.trim()
    const trimmedMethod = preparationMethod.trim()
    const cleanedIngredients = ingredients.map((item) => ({
      amount: Number(item.amount),
      ingredientName: item.ingredientName.trim(),
      measurementName: normalizeMeasurement(item.measurementName),
    }))

    if (draft.ingredientName.trim()) {
      const message = 'Há um ingrediente digitado sem adicionar. Clique em “Adicionar à lista”.'
      setComposerError(message)
      notify.warning(message, 'Ingredientes')
      return
    }

    if (!trimmedName || !trimmedCategory || !trimmedMethod) {
      const message = 'Preencha nome, categoria e método de preparo.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }
    if (!Number.isFinite(portions) || portions <= 0) {
      const message = 'Porções deve ser um número maior que zero.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }
    if (!Number.isInteger(preparationTime) || preparationTime < 0) {
      const message = 'Tempo de preparo deve ser um inteiro maior ou igual a zero.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }
    if (cleanedIngredients.length === 0) {
      const message = 'Adicione ao menos um ingrediente à lista.'
      setError(message)
      setComposerError(message)
      notify.warning(message, 'Validação')
      return
    }
    if (cleanedIngredients.some((item) => !Number.isFinite(item.amount) || item.amount <= 0)) {
      const message = 'Quantidade de cada ingrediente deve ser maior que zero.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        userId: DEMO_COOK_USER_ID,
        name: trimmedName,
        categoryName: trimmedCategory,
        preparationMethod: trimmedMethod,
        portions,
        preparationTime,
        ingredientsRecipe: cleanedIngredients,
        description: description.trim() || '',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível salvar a receita.'
      setError(message)
      notify.error(message, 'Falha na operação')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={pageStyles.form} onSubmit={handleSubmit}>
      <div className={pageStyles.grid}>
        <label className={pageStyles.label}>
          Nome
          <input
            className={pageStyles.input}
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className={pageStyles.label}>
          Categoria
          <select
            className={pageStyles.input}
            name="categoryName"
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            required
            disabled={loadingCategories || categories.length === 0}
          >
            {categories.length === 0 ? <option value="">Carregando…</option> : null}
            {categories.map((category) =>
              category.name ? (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ) : null,
            )}
          </select>
        </label>
        <label className={pageStyles.label}>
          Porções
          <input
            className={pageStyles.input}
            name="portions"
            type="number"
            min={0.1}
            step={0.5}
            value={portions}
            onChange={(event) => setPortions(Number(event.target.value))}
            required
          />
        </label>
        <label className={pageStyles.label}>
          Tempo (minutos)
          <input
            className={pageStyles.input}
            name="preparationTime"
            type="number"
            min={0}
            step={1}
            value={preparationTime}
            onChange={(event) => setPreparationTime(Number(event.target.value))}
            required
          />
        </label>
      </div>

      <label className={pageStyles.label}>
        Método de preparo
        <textarea
          className={pageStyles.input}
          name="preparationMethod"
          rows={4}
          value={preparationMethod}
          onChange={(event) => setPreparationMethod(event.target.value)}
          required
        />
      </label>

      <label className={pageStyles.label}>
        Descrição
        <textarea
          className={pageStyles.input}
          name="description"
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <section className={styles.ingredientsBlock} aria-labelledby={listHeadingId}>
        <header className={styles.ingredientsHeader}>
          <h2 id={listHeadingId}>Ingredientes</h2>
          <p>
            Monte cada item e adicione à lista. A unidade é padronizada para manter o texto
            consistente na receita.
          </p>
        </header>

        <div className={styles.composer}>
          <label className={styles.composerLabel}>
            Qtd.
            <input
              className={styles.composerInput}
              type="number"
              min={0.01}
              step={0.01}
              value={draft.amount}
              onChange={(event) =>
                setDraft((current) => ({ ...current, amount: Number(event.target.value) }))
              }
              onKeyDown={handleDraftKeyDown}
              inputMode="decimal"
              aria-label="Quantidade do ingrediente"
            />
          </label>
          <label className={styles.composerLabel}>
            Unidade
            <select
              className={styles.composerSelect}
              value={draft.measurementName}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  measurementName: event.target.value as MeasurementValue,
                }))
              }
              onKeyDown={handleDraftKeyDown}
              aria-label="Unidade de medida"
            >
              {MEASUREMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.composerLabel}>
            Ingrediente
            <input
              ref={nameInputRef}
              className={styles.composerInput}
              value={draft.ingredientName}
              onChange={(event) =>
                setDraft((current) => ({ ...current, ingredientName: event.target.value }))
              }
              onKeyDown={handleDraftKeyDown}
              placeholder="ex.: farinha de trigo"
              aria-label="Nome do ingrediente"
            />
          </label>
          <button type="button" className={styles.addButton} onClick={addIngredientFromDraft}>
            Adicionar à lista
          </button>
          <p className={styles.composerPreview} aria-live="polite">
            {draftPreview ? (
              <>
                Prévia: <strong>{draftPreview}</strong>
              </>
            ) : (
              'Prévia aparece ao preencher quantidade e nome.'
            )}
          </p>
        </div>

        {composerError ? <p className={styles.composerError}>{composerError}</p> : null}

        {ingredients.length === 0 ? (
          <p className={styles.emptyList}>Nenhum ingrediente na lista ainda.</p>
        ) : (
          <ul className={styles.list}>
            {ingredients.map((ingredient, index) => (
              <li
                key={`${ingredient.ingredientName}-${ingredient.measurementName}-${index}`}
                className={styles.listItem}
              >
                <span className={styles.listIndex}>{index + 1}</span>
                <p className={styles.listText}>
                  {formatIngredientLine(
                    ingredient.amount,
                    ingredient.measurementName,
                    ingredient.ingredientName,
                  )}
                </p>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeIngredient(index)}
                  aria-label={`Remover ${ingredient.ingredientName}`}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? <p className={pageStyles.error}>{error}</p> : null}

      <button
        className={pageStyles.submit}
        type="submit"
        disabled={submitting || loadingCategories || categories.length === 0}
      >
        {submitting ? 'Salvando…' : submitLabel}
      </button>
    </form>
  )
}
