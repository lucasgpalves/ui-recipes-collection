import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { GoalRequest } from '../../../../shared/api/types'
import { GoalForm } from '../components/GoalForm'
import { createGoal } from '../api/goals'
import styles from '../../shared/pages.module.css'

export function AdminGoalCreatePage() {
  const navigate = useNavigate()

  async function handleCreate(payload: GoalRequest) {
    try {
      await createGoal(payload)
      navigate('/admin/metas', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(`Falha ao cadastrar (status ${err.status}).`)
      }
      throw new Error('Não foi possível cadastrar a meta.')
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Nova meta</h1>
          <p>Cadastro alinhado ao GoalRequestDTO (title, amount, roleName).</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/metas" className={styles.ghostButton}>
            Voltar à listagem
          </Link>
        </div>
      </header>

      <GoalForm submitLabel="Cadastrar meta" onSubmit={handleCreate} />
    </div>
  )
}
