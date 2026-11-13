import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { Goal, GoalRequest } from '../../../../shared/api/types'
import { GoalForm } from '../components/GoalForm'
import { fetchGoalById, updateGoal } from '../api/goals'
import styles from '../../shared/pages.module.css'

export function AdminGoalEditPage() {
  const { id } = useParams()
  const goalId = Number(id)
  const navigate = useNavigate()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(goalId) || goalId <= 0) {
      setError('Meta inválida.')
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    fetchGoalById(goalId)
      .then((data) => {
        if (active) setGoal(data)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar a meta.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [goalId])

  const initial = useMemo<Partial<GoalRequest> | undefined>(() => {
    if (!goal) return undefined
    return {
      title: goal.title ?? '',
      amount: goal.amount,
      description: goal.description ?? '',
      roleName: goal.role?.name ?? '',
    }
  }, [goal])

  async function handleUpdate(payload: GoalRequest) {
    try {
      await updateGoal(goalId, payload)
      navigate('/admin/metas', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(`Falha ao atualizar (status ${err.status}).`)
      }
      throw new Error('Não foi possível atualizar a meta.')
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Editar meta</h1>
          <p>Atualização via PUT /goals/{'{id}'}.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/metas" className={styles.ghostButton}>
            Listagem
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {!loading && goal && initial ? (
        <GoalForm
          key={goal.id ?? 'edit'}
          initial={initial}
          submitLabel="Salvar alterações"
          onSubmit={handleUpdate}
        />
      ) : null}
    </div>
  )
}
