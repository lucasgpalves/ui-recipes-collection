import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { Recipe, RecipeRequest } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { useAuth } from '../../../auth'
import { RecipeForm } from '../components/RecipeForm'
import { fetchCookRecipe, updateRecipe } from '../api/recipes'
import styles from '../../../admin/shared/pages.module.css'

export function CookRecipeEditPage() {
  const { id } = useParams()
  const recipeId = Number(id)
  const navigate = useNavigate()
  const notify = useNotify()
  const { username } = useAuth()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(recipeId) || recipeId <= 0) {
      setError('Receita inválida.')
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    fetchCookRecipe(recipeId)
      .then((data) => {
        if (!active) return
        if (
          username &&
          (data.userName ?? '').toLowerCase() !== username.trim().toLowerCase()
        ) {
          setError('Esta receita não pertence à sua conta.')
          setRecipe(null)
          return
        }
        setRecipe(data)
      })
      .catch(() => {
        if (active) {
          setError('Não foi possível carregar a receita.')
          notify.error('Não foi possível carregar a receita.', 'Falha ao carregar')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [recipeId, username, notify])

  async function handleUpdate(payload: RecipeRequest) {
    if (!username) {
      throw new Error('Sessão sem usuário. Entre novamente como cook.')
    }
    try {
      await updateRecipe(recipeId, payload, username)
      notify.success(`Receita "${payload.name}" atualizada.`, 'Edição')
      navigate('/cook/receitas', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(`Falha ao atualizar (status ${err.status}).`)
      }
      throw new Error('Não foi possível atualizar a receita.')
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Editar receita</h1>
          <p>Atualização via PUT /recipes/{'{id}'}.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/cook/receitas" className={styles.ghostButton}>
            Listagem
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {!loading && recipe ? (
        <RecipeForm
          key={recipe.id ?? 'edit'}
          initial={recipe}
          submitLabel="Salvar alterações"
          onSubmit={handleUpdate}
        />
      ) : null}
    </div>
  )
}
