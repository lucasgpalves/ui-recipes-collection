import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import { useNotify } from '../../../../shared/ui/notify'
import {
  approveIngredient,
  fetchEditorIngredients,
  rejectIngredient,
  reopenIngredient,
  type EditorIngredient,
} from '../api/ingredients'
import styles from '../../../admin/shared/pages.module.css'

function statusLabel(status: string | null | undefined): string {
  if (status === 'approved') return 'Aprovado'
  if (status === 'rejected') return 'Rejeitado'
  if (status === 'pending') return 'Pendente'
  return status ?? '—'
}

export function EditorIngredientsListPage() {
  const notify = useNotify()
  const [ingredients, setIngredients] = useState<EditorIngredient[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

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

  async function runStatusAction(
    id: number,
    action: 'approve' | 'reject' | 'reopen',
    label: string,
  ) {
    setBusyId(id)
    try {
      if (action === 'approve') await approveIngredient(id, {})
      if (action === 'reject') await rejectIngredient(id)
      if (action === 'reopen') await reopenIngredient(id)
      setIngredients(await fetchEditorIngredients())
      notify.success(`${label} concluído.`, 'Ingrediente')
    } catch (err) {
      if (err instanceof ApiError) {
        notify.error(err.message || `Falha ao ${label.toLowerCase()} (status ${err.status}).`, label)
      } else {
        notify.error(`Não foi possível ${label.toLowerCase()}.`, label)
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Ingredientes</h1>
          <p>Governança do catálogo: aprovar, rejeitar, reabrir, aliases e merge.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/editor/ingredientes/merge" className={styles.primaryButton}>
            Merge
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {!loading && ingredients.length === 0 ? (
        <p className={styles.muted}>Nenhum ingrediente encontrado.</p>
      ) : null}

      {ingredients.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient) => {
                const id = ingredient.id
                const status = ingredient.status
                const busy = busyId === id
                return (
                  <tr key={id}>
                    <td>
                      <strong>{ingredient.name ?? '—'}</strong>
                    </td>
                    <td>
                      <span
                        className={
                          status === 'approved'
                            ? styles.statusActive
                            : status === 'rejected'
                              ? styles.statusTerminated
                              : styles.muted
                        }
                      >
                        {statusLabel(status)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        {status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              className={styles.linkButton}
                              disabled={busy}
                              onClick={() => void runStatusAction(id, 'approve', 'Aprovar')}
                            >
                              Aprovar
                            </button>
                            <button
                              type="button"
                              className={styles.dangerButton}
                              disabled={busy}
                              onClick={() => void runStatusAction(id, 'reject', 'Rejeitar')}
                            >
                              Rejeitar
                            </button>
                          </>
                        ) : null}
                        {status === 'approved' || status === 'rejected' ? (
                          <button
                            type="button"
                            className={styles.linkButton}
                            disabled={busy}
                            onClick={() => void runStatusAction(id, 'reopen', 'Reabrir')}
                          >
                            Reabrir
                          </button>
                        ) : null}
                        <Link
                          to={`/editor/ingredientes/${id}/aliases`}
                          className={styles.linkButton}
                        >
                          Aliases
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
