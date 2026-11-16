import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MutableRefObject,
} from 'react'
import { fetchCategories } from '../../../catalog'
import { useAuth } from '../../../auth'
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
import { recipePreparationMinutes } from '../lib/ownership'
import { RecipePreviewModal } from './RecipePreviewModal'
import styles from './RecipeForm.module.css'

export type RecipeFormMedia = {
  file: File | null
  removeImage: boolean
}

type RecipeFormProps = {
  initial?: Recipe | null
  submitLabel: string
  onSubmit: (payload: RecipeRequest) => Promise<void>
  /** Preenchido imediatamente antes de `onSubmit` (upload/remoção de imagem). */
  mediaRef?: MutableRefObject<RecipeFormMedia>
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

export function RecipeForm({ initial, submitLabel, onSubmit, mediaRef }: RecipeFormProps) {
  const notify = useNotify()
  const { username, userId } = useAuth()
  const listHeadingId = useId()
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(initial?.name ?? '')
  const [categoryName, setCategoryName] = useState(initial?.categoryName ?? '')
  const [preparationMethod, setPreparationMethod] = useState(initial?.preparationMethod ?? '')
  const [portions, setPortions] = useState(
    Number.isInteger(initial?.portions) ? (initial?.portions as number) : Math.max(1, Math.round(initial?.portions ?? 1)),
  )
  const [preparationTime, setPreparationTime] = useState(() => recipePreparationMinutes(initial ?? {}))
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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const published = Boolean(initial?.isPublished)
  const persistedImageUrl = !removeImage ? (initial?.imageUrl ?? null) : null
  const displayImageUrl = imagePreviewUrl ?? persistedImageUrl

  const closePreview = useCallback(() => setPreviewOpen(false), [])

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  function clearSelectedFile() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImageFile(null)
    setImagePreviewUrl(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  function handleImagePick(file: File | null) {
    if (!file) {
      clearSelectedFile()
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      notify.warning('Use JPEG, PNG ou WebP.', 'Imagem')
      return
    }
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
    setRemoveImage(false)
  }

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
    if (!Number.isInteger(portions) || portions <= 0) {
      const message = 'Porções deve ser um inteiro maior que zero.'
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

    if (userId == null) {
      const message = 'Sessão sem userId. Entre novamente como cozinheiro.'
      setError(message)
      notify.warning(message, 'Validação')
      return
    }

    setSubmitting(true)
    try {
      if (mediaRef) {
        mediaRef.current = { file: imageFile, removeImage }
      }
      await onSubmit({
        userId,
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
            min={1}
            step={1}
            inputMode="numeric"
            value={portions}
            onChange={(event) => setPortions(Number.parseInt(event.target.value, 10) || 0)}
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

      <section className={styles.imageBlock} aria-label="Imagem da receita">
        <header className={styles.imageHeader}>
          <h2>Imagem</h2>
          <p>
            {published
              ? 'Receita publicada: a imagem não pode ser alterada.'
              : 'Opcional. JPEG, PNG ou WebP (máx. 5 MiB no servidor).'}
          </p>
        </header>
        <div
          className={`${styles.imagePreview} ${displayImageUrl ? '' : styles.imagePreviewEmpty}`}
          style={displayImageUrl ? { backgroundImage: `url(${displayImageUrl})` } : undefined}
          role="img"
          aria-label={displayImageUrl ? 'Prévia da imagem da receita' : 'Sem imagem'}
        >
          {!displayImageUrl ? <span>Sem imagem</span> : null}
        </div>
        {!published ? (
          <div className={styles.imageActions}>
            <label className={styles.imageFileLabel}>
              Escolher imagem
              <input
                ref={imageInputRef}
                className={styles.imageFileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => handleImagePick(event.target.files?.[0] ?? null)}
              />
            </label>
            {imageFile || (!removeImage && initial?.imageUrl) ? (
              <button
                type="button"
                className={styles.imageRemoveButton}
                onClick={() => {
                  clearSelectedFile()
                  if (initial?.imageUrl) setRemoveImage(true)
                }}
              >
                Remover imagem
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

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

      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.previewButton}
          onClick={() => setPreviewOpen(true)}
        >
          Ver prévia
        </button>
        <button
          className={pageStyles.submit}
          type="submit"
          disabled={submitting || loadingCategories || categories.length === 0}
        >
          {submitting ? 'Salvando…' : submitLabel}
        </button>
      </div>

      <RecipePreviewModal
        open={previewOpen}
        onClose={closePreview}
        data={{
          name,
          categoryName,
          description,
          preparationMethod,
          portions,
          preparationTime,
          authorName: username ?? initial?.userName ?? null,
          imageUrl: displayImageUrl,
          ingredients,
        }}
      />
    </form>
  )
}
