import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { RoleRequest } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { RoleForm } from '../components/RoleForm'
import { createRole } from '../api/roles'
import styles from '../../shared/pages.module.css'

export function AdminRoleCreatePage() {
  const navigate = useNavigate()
  const notify = useNotify()

  async function handleCreate(payload: RoleRequest) {
    try {
      await createRole(payload)
      notify.success(`Papel "${payload.name}" cadastrado.`, 'Cadastro')
      navigate('/admin/papeis', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(`Falha ao cadastrar (status ${err.status}).`)
      }
      throw new Error('Não foi possível cadastrar o papel.')
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Novo papel</h1>
          <p>Cadastro alinhado ao RoleRequestDTO (nome em maiúsculas).</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/papeis" className={styles.ghostButton}>
            Voltar à listagem
          </Link>
        </div>
      </header>

      <RoleForm submitLabel="Cadastrar papel" onSubmit={handleCreate} />
    </div>
  )
}
