import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import { useNotify } from '../../../../shared/ui/notify'
import {
  addIngredientAlias,
  fetchEditorIngredientById,
  type EditorIngredient,
} from '../api/ingredients'
import styles from '../../../admin/shared/pages.module.css'

export function EditorIngredientAliasesPage() {
  const { id } = useParams()
  const ingredientId = Number(id)
  const notify = useNotify()
  const [ingredient, setIngredient] = useState<EditorIngredient | null>(null)
  const [alias, setAlias] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadIngredient = useCallback(async () => {
    if (!Number.isFinite(ingredientId) || ingredientId <= 0) {
      setIngredient(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setIngredient(await fetchEditorIngredientById(ingredientId))
    } catch {
      notify.error('Não foi possível carregar o ingrediente.', 'Aliases')
      setIngredient(null)
    } finally {
      setLoading(false)
    }
  }, [ingredientId, notify])

  useEffect(() => {
    void loadIngredient()
  }, [loadIngredient])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = alias.trim()
    if (!value) {
      notify.warning('Informe um alias.', 'Aliases')
      return
    }

    setSubmitting(true)
    try {
      await addIngredientAlias(ingredientId, value)
      setAlias('')
      notify.success('Alias adicionado.', 'Aliases')
    } catch (err) {
      if (err instanceof ApiError) {
        notify.error(err.message || `Falha ao adicionar alias (status ${err.status}).`, 'Aliases')
      } else {
        notify.error('Não foi possível adicionar o alias.', 'Aliases')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Aliases</h1>
          <p>
            Gerencie nomes alternativos de{' '}
            <strong>{ingredient?.name ?? (loading ? '…' : `#${ingredientId}`)}</strong>.
          </p>
        </div>
        <div className={styles.actions}>
          <Link to="/editor/ingredientes" className={styles.ghostButton}>
            Voltar à listagem
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}

      {!loading ? (
        <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
          <label className={styles.label} htmlFor="editor-new-alias">
            Nome alternativo
          </label>
          <input
            id="editor-new-alias"
            className={styles.input}
            value={alias}
            onChange={(event) => setAlias(event.target.value)}
            placeholder="Ex.: farinha branca"
            aria-label="Novo alias"
            required
          />
          <button
            type="submit"
            className={styles.submit}
            disabled={submitting}
            aria-label="Adicionar alias"
          >
            Adicionar
          </button>
        </form>
      ) : null}
    </div>
  )
}
