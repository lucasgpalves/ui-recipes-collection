import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { UserRequest } from '../../../../shared/api/types'
import { UserForm } from '../components/UserForm'
import { createUser } from '../api/users'
import styles from './users.module.css'

export function AdminUserCreatePage() {
  const navigate = useNavigate()

  async function handleCreate(payload: UserRequest) {
    try {
      const created = await createUser(payload)
      if (created?.id != null) {
        navigate(`/admin/usuarios/${created.id}`, { replace: true })
        return
      }
      navigate('/admin/usuarios', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(`Falha ao cadastrar (status ${err.status}).`)
      }
      throw new Error('Não foi possível cadastrar o usuário.')
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Cadastro</h1>
          <p>Novo perfil alinhado ao UserRequestDTO da API.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/usuarios" className={styles.ghostButton}>
            Voltar à listagem
          </Link>
        </div>
      </header>

      <UserForm submitLabel="Cadastrar usuário" onSubmit={handleCreate} />
    </div>
  )
}
