import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { Goal } from '../../../../shared/api/types'
import { deleteGoal, fetchGoals } from '../api/goals'
import styles from '../../shared/pages.module.css'

export function AdminGoalsListPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadGoals = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchGoals()
      setGoals(data)
      setError(null)
    } catch {
      setError('Não foi possível carregar as metas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadGoals()
  }, [loadGoals])

  async function handleDelete(goal: Goal) {
    if (goal.id == null) return
    const confirmed = window.confirm(
      `Excluir a meta "${goal.title ?? goal.id}"? Essa ação não pode ser desfeita.`,
    )
    if (!confirmed) return

    setDeletingId(goal.id)
    setError(null)
    try {
      await deleteGoal(goal.id)
      const refreshed = await fetchGoals()
      setGoals(refreshed)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Falha ao excluir (status ${err.status}).`)
      } else {
        setError('Não foi possível excluir a meta.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Metas</h1>
          <p>Regras de desempenho por papel (ex.: quantidade de receitas/mês para COOK).</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/metas/nova" className={styles.primaryButton}>
            Nova meta
          </Link>
        </div>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {!loading && goals.length === 0 ? (
        <p className={styles.muted}>Nenhuma meta cadastrada ainda.</p>
      ) : null}

      {goals.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Papel</th>
                <th>Meta</th>
                <th>Início</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => (
                <tr key={goal.id ?? goal.title}>
                  <td>
                    <strong>{goal.title ?? '—'}</strong>
                    {goal.description ? <div className={styles.muted}>{goal.description}</div> : null}
                  </td>
                  <td>{goal.role?.name ?? '—'}</td>
                  <td>{goal.amount}</td>
                  <td>{goal.startsAt ?? '—'}</td>
                  <td>
                    {goal.id != null ? (
                      <div className={styles.rowActions}>
                        <Link to={`/admin/metas/${goal.id}/editar`} className={styles.linkButton}>
                          Editar
                        </Link>
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => void handleDelete(goal)}
                          disabled={deletingId === goal.id}
                        >
                          {deletingId === goal.id ? 'Excluindo…' : 'Excluir'}
                        </button>
                      </div>
                    ) : (
                      <span className={styles.muted}>Sem id</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
