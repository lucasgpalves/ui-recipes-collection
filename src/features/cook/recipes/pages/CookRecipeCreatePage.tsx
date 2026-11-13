import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { RecipeRequest } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { useAuth } from '../../../auth'
import { RecipeForm } from '../components/RecipeForm'
import { createRecipe } from '../api/recipes'
import styles from '../../../admin/shared/pages.module.css'

export function CookRecipeCreatePage() {
  const navigate = useNavigate()
  const notify = useNotify()
  const { username } = useAuth()

  async function handleCreate(payload: RecipeRequest) {
    if (!username) {
      throw new Error('Sessão sem usuário. Entre novamente como cook.')
    }
    try {
      await createRecipe(payload, username)
      notify.success(`Receita "${payload.name}" cadastrada.`, 'Cadastro')
      navigate('/cook/receitas', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(`Falha ao cadastrar (status ${err.status}).`)
      }
      throw new Error('Não foi possível cadastrar a receita.')
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Nova receita</h1>
          <p>Cadastro alinhado ao RecipeRequestDTO (ingredientes inclusos).</p>
        </div>
        <div className={styles.actions}>
          <Link to="/cook/receitas" className={styles.ghostButton}>
            Voltar à listagem
          </Link>
        </div>
      </header>

      <RecipeForm submitLabel="Cadastrar receita" onSubmit={handleCreate} />
    </div>
  )
}
