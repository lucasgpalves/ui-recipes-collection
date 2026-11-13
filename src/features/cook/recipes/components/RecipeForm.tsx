import { useEffect, useState, type FormEvent } from 'react'
import { DEMO_COOK_USER_ID } from '../../../../demo/demoApi'
import { fetchCategories } from '../../../catalog'
import type {
  Category,
  Recipe,
  RecipeIngredientRequest,
  RecipeRequest,
} from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import styles from '../../../admin/shared/pages.module.css'

type RecipeFormProps = {
  initial?: Recipe | null
  submitLabel: string
  onSubmit: (payload: RecipeRequest) => Promise<void>
}

const EMPTY_INGREDIENT: RecipeIngredientRequest = {
  amount: 1,
  ingredientName: '',
  measurementName: '',
}

function ingredientsFromRecipe(recipe?: Recipe | null): RecipeIngredientRequest[] {
  if (!recipe?.ingredients?.length) return [{ ...EMPTY_INGREDIENT }]
  return recipe.ingredients.map((item) => ({
    amount: item.amount ?? 1,
    ingredientName: item.ingredientName ?? '',
    measurementName: item.measurementName ?? '',
  }))
}

export function RecipeForm({ initial, submitLabel, onSubmit }: RecipeFormProps) {
  const notify = useNotify()
  const [name, setName] = useState(initial?.name ?? '')
  const [categoryName, setCategoryName] = useState(initial?.categoryName ?? '')
  const [preparationMethod, setPreparationMethod] = useState(initial?.preparationMethod ?? '')
  const [portions, setPortions] = useState(initial?.portions ?? 1)
  const [preparationTime, setPreparationTime] = useState(initial?.durationMinutes ?? 30)
  const [description, setDescription] = useState(initial?.description ?? '')
  const [ingredients, setIngredients] = useState<RecipeIngredientRequest[]>(() =>
    ingredientsFromRecipe(initial),
  )
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  function updateIngredient(
    index: number,
    key: keyof RecipeIngredientRequest,
    value: string | number,
  ) {
    setIngredients((current) =>
      current.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    const trimmedCategory = categoryName.trim()
    const trimmedMethod = preparationMethod.trim()
    const cleanedIngredients = ingredients
      .map((item) => ({
        amount: Number(item.amount),
        ingredientName: item.ingredientName.trim(),
        measurementName: item.measurementName.trim(),
      }))
      .filter((item) => item.ingredientName && item.measurementName)

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
      const message = 'Adicione ao menos um ingrediente completo.'
      setError(message)
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
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label className={styles.label}>
          Nome
          <input
            className={styles.input}
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          Categoria
          <select
            className={styles.input}
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
        <label className={styles.label}>
          Porções
          <input
            className={styles.input}
            name="portions"
            type="number"
            min={0.1}
            step={0.5}
            value={portions}
            onChange={(event) => setPortions(Number(event.target.value))}
            required
          />
        </label>
        <label className={styles.label}>
          Tempo (minutos)
          <input
            className={styles.input}
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

      <label className={styles.label}>
        Método de preparo
        <textarea
          className={styles.input}
          name="preparationMethod"
          rows={4}
          value={preparationMethod}
          onChange={(event) => setPreparationMethod(event.target.value)}
          required
        />
      </label>

      <label className={styles.label}>
        Descrição
        <textarea
          className={styles.input}
          name="description"
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <div>
        <div className={styles.intro} style={{ marginBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Ingredientes</h2>
            <p className={styles.muted} style={{ margin: '0.25rem 0 0' }}>
              Informe quantidade, nome e unidade de medida.
            </p>
          </div>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() => setIngredients((current) => [...current, { ...EMPTY_INGREDIENT }])}
          >
            Adicionar
          </button>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {ingredients.map((ingredient, index) => (
            <div key={index} className={styles.grid}>
              <label className={styles.label}>
                Qtd.
                <input
                  className={styles.input}
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={ingredient.amount}
                  onChange={(event) => updateIngredient(index, 'amount', Number(event.target.value))}
                  required
                />
              </label>
              <label className={styles.label}>
                Ingrediente
                <input
                  className={styles.input}
                  value={ingredient.ingredientName}
                  onChange={(event) =>
                    updateIngredient(index, 'ingredientName', event.target.value)
                  }
                  required
                />
              </label>
              <label className={styles.label}>
                Medida
                <input
                  className={styles.input}
                  value={ingredient.measurementName}
                  onChange={(event) =>
                    updateIngredient(index, 'measurementName', event.target.value)
                  }
                  required
                />
              </label>
              <div className={styles.label}>
                <span>&nbsp;</span>
                <button
                  type="button"
                  className={styles.dangerButton}
                  disabled={ingredients.length <= 1}
                  onClick={() =>
                    setIngredients((current) => current.filter((_, i) => i !== index))
                  }
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
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
