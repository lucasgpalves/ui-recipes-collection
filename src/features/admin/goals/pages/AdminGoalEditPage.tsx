import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { Goal, GoalRequest } from '../../../../shared/api/types'
import { useAuth } from '../../../auth'
import { useNotify } from '../../../../shared/ui/notify'
import { GoalForm } from '../components/GoalForm'
import { GoalProgressPanel } from '../components/GoalProgressPanel'
import { fetchGoalById, updateGoal } from '../api/goals'
import styles from '../../shared/pages.module.css'

export function AdminGoalEditPage() {
  const { id } = useParams()
  const goalId = Number(id)
  const navigate = useNavigate()
  const notify = useNotify()
  const { userId: sessionUserId } = useAuth()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progressUserId, setProgressUserId] = useState('')
  const [progressMonth, setProgressMonth] = useState('')
  const [progressYear, setProgressYear] = useState('')

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

  useEffect(() => {
    if (sessionUserId != null && progressUserId === '') {
      setProgressUserId(String(sessionUserId))
    }
  }, [sessionUserId, progressUserId])

  const parsedProgressUserId = Number(progressUserId)
  const parsedMonth = progressMonth.trim() === '' ? undefined : Number(progressMonth)
  const parsedYear = progressYear.trim() === '' ? undefined : Number(progressYear)
  const canQueryProgress =
    Number.isFinite(parsedProgressUserId) &&
    parsedProgressUserId > 0 &&
    (parsedMonth === undefined || (Number.isFinite(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12)) &&
    (parsedYear === undefined || (Number.isFinite(parsedYear) && parsedYear >= 2000))

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
      notify.success(`Meta "${payload.title}" atualizada.`, 'Edição')
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
        <>
          <GoalForm
            key={goal.id ?? 'edit'}
            initial={initial}
            submitLabel="Salvar alterações"
            onSubmit={handleUpdate}
          />

          <section aria-label="Consulta de progresso">
            <div className={styles.sectionHeading}>
              <div>
                <h2>Progresso</h2>
                <p>Consulta GET /goals/{'{id}'}/progress (userId da sessão por padrão; self-only na API).</p>
              </div>
            </div>
            <div className={styles.form}>
              <div className={styles.grid}>
                <label className={styles.label}>
                  userId
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    value={progressUserId}
                    onChange={(event) => setProgressUserId(event.target.value)}
                  />
                </label>
                <span aria-hidden />
                <label className={styles.label}>
                  Mês (opcional)
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    placeholder="1–12"
                    value={progressMonth}
                    onChange={(event) => setProgressMonth(event.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  Ano (opcional)
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    placeholder="ex.: 2026"
                    value={progressYear}
                    onChange={(event) => setProgressYear(event.target.value)}
                  />
                </label>
              </div>
              {canQueryProgress ? (
                <GoalProgressPanel
                  goalId={goal.id}
                  userId={parsedProgressUserId}
                  month={parsedMonth}
                  year={parsedYear}
                />
              ) : (
                <p className={styles.muted}>Informe um userId válido para consultar o progresso.</p>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
