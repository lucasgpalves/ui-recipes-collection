import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { CategoryRequest } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { CategoryForm } from '../components/CategoryForm'
import { createCategory } from '../api/categories'
import styles from '../../shared/pages.module.css'

export function AdminCategoryCreatePage() {
  const navigate = useNavigate()
  const notify = useNotify()

  async function handleCreate(payload: CategoryRequest) {
    try {
      await createCategory(payload)
      notify.success(`Categoria "${payload.name}" cadastrada.`, 'Cadastro')
      navigate('/admin/categorias', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(`Falha ao cadastrar (status ${err.status}).`)
      }
      throw new Error('Não foi possível cadastrar a categoria.')
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Nova categoria</h1>
          <p>Cadastro alinhado ao CategoryRequestDTO da API.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/categorias" className={styles.ghostButton}>
            Voltar à listagem
          </Link>
        </div>
      </header>

      <CategoryForm submitLabel="Cadastrar categoria" onSubmit={handleCreate} />
    </div>
  )
}
