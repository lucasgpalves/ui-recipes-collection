import { useEffect, useState } from 'react'
import type { GoalProgress } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { fetchGoalProgress } from '../api/goals'
import styles from '../../shared/pages.module.css'

type GoalProgressPanelProps = {
  goalId: number | null
  userId: number
  month?: number
  year?: number
}

export function GoalProgressPanel({ goalId, userId, month, year }: GoalProgressPanelProps) {
  const notify = useNotify()
  const [progress, setProgress] = useState<GoalProgress | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (goalId == null) {
      setProgress(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setProgress(null)

    fetchGoalProgress(goalId, { userId, month, year })
      .then((data) => {
        if (active) setProgress(data)
      })
      .catch(() => {
        if (active) {
          setProgress(null)
          notify.error('Não foi possível carregar o progresso da meta.', 'Falha ao carregar')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [goalId, userId, month, year, notify])

  if (goalId == null) {
    return <p className={styles.muted}>Sem id de meta para consultar progresso.</p>
  }

  if (loading) {
    return <p className={styles.muted}>Carregando progresso…</p>
  }

  if (!progress) {
    return null
  }

  return (
    <section className={styles.profileCard} aria-label="Progresso da meta">
      <div className={styles.profileGrid}>
        <div>
          <span className={styles.fieldLabel}>userId</span>
          <p className={styles.fieldValue}>{progress.userId ?? '—'}</p>
        </div>
        <div>
          <span className={styles.fieldLabel}>target</span>
          <p className={styles.fieldValue}>{progress.target}</p>
        </div>
        <div>
          <span className={styles.fieldLabel}>progress</span>
          <p className={styles.fieldValue}>{progress.progress}</p>
        </div>
        <div>
          <span className={styles.fieldLabel}>Situação</span>
          <p
            className={`${styles.fieldValue} ${
              progress.completed ? styles.statusActive : styles.muted
            }`}
          >
            {progress.completed ? 'Concluída' : 'Em andamento'}
          </p>
        </div>
      </div>
    </section>
  )
}
