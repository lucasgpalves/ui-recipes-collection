import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import { useNotify } from '../../../../shared/ui/notify'
import {
  fetchEditorIngredients,
  mergeIngredients,
  type EditorIngredient,
} from '../api/ingredients'
import styles from '../../../admin/shared/pages.module.css'

export function EditorIngredientsMergePage() {
  const notify = useNotify()
  const [ingredients, setIngredients] = useState<EditorIngredient[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadIngredients = useCallback(async () => {
    setLoading(true)
    try {
      setIngredients(await fetchEditorIngredients())
    } catch {
      notify.error('Não foi possível carregar os ingredientes.', 'Falha ao carregar')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    void loadIngredients()
  }, [loadIngredients])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const source = Number(sourceId)
    const target = Number(targetId)
    if (!Number.isFinite(source) || !Number.isFinite(target) || source <= 0 || target <= 0) {
      notify.warning('Selecione origem e destino válidos.', 'Merge')
      return
    }
    if (source === target) {
      notify.warning('Origem e destino devem ser diferentes.', 'Merge')
      return
    }

    setSubmitting(true)
    try {
      await mergeIngredients(target, source)
      setIngredients((prev) => prev.filter((ingredient) => ingredient.id !== source))
      setSourceId('')
      setTargetId('')
      notify.success('Merge concluído.', 'Merge')
    } catch (err) {
      if (err instanceof ApiError) {
        notify.error(err.message || `Falha no merge (status ${err.status}).`, 'Merge')
      } else {
        notify.error('Não foi possível concluir o merge.', 'Merge')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Merge de ingredientes</h1>
          <p>A origem é absorvida pelo destino e removida do catálogo.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/editor/ingredientes" className={styles.ghostButton}>
            Voltar à listagem
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}

      {!loading ? (
        <>
          {ingredients.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ingredient) => (
                    <tr key={ingredient.id}>
                      <td>{ingredient.id}</td>
                      <td>{ingredient.name ?? '—'}</td>
                      <td>{ingredient.status ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.muted}>Nenhum ingrediente disponível para merge.</p>
          )}

          <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
            <label className={styles.label}>
              Origem
              <select
                className={styles.input}
                value={sourceId}
                onChange={(event) => setSourceId(event.target.value)}
                required
              >
                <option value="">Selecione…</option>
                {ingredients.map((ingredient) => (
                  <option key={`source-${ingredient.id}`} value={ingredient.id}>
                    #{ingredient.id}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              Destino
              <select
                className={styles.input}
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
                required
              >
                <option value="">Selecione…</option>
                {ingredients.map((ingredient) => (
                  <option key={`target-${ingredient.id}`} value={ingredient.id}>
                    #{ingredient.id}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className={styles.submit} disabled={submitting}>
              Confirmar merge
            </button>
          </form>
        </>
      ) : null}
    </div>
  )
}
