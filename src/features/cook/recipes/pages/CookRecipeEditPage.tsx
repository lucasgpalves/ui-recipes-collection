import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { Recipe, RecipeRequest } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { useAuth } from '../../../auth'
import { RecipeForm, type RecipeFormMedia } from '../components/RecipeForm'
import {
  deleteRecipeImage,
  fetchCookRecipe,
  updateRecipe,
  uploadRecipeImage,
} from '../api/recipes'
import { isOwnRecipe } from '../lib/ownership'
import styles from '../../../admin/shared/pages.module.css'

function mediaErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 413) return 'A imagem excede o tamanho máximo permitido (5 MiB).'
    if (err.status === 415) return 'Tipo de imagem não suportado. Use JPEG, PNG ou WebP.'
    if (err.status === 422) return 'Arquivo de imagem inválido.'
    if (err.status === 409) return 'Não é possível alterar a imagem desta receita.'
    if (err.status === 403) return 'Sem permissão para alterar a imagem.'
    return `Falha na imagem (status ${err.status}).`
  }
  return 'Não foi possível atualizar a imagem da receita.'
}

export function CookRecipeEditPage() {
  const { id } = useParams()
  const recipeId = Number(id)
  const navigate = useNavigate()
  const notify = useNotify()
  const { username, userId } = useAuth()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mediaRef = useRef<RecipeFormMedia>({ file: null, removeImage: false })

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
        if (!isOwnRecipe(data, { userId, username })) {
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
  }, [recipeId, username, userId, notify])

  async function handleUpdate(payload: RecipeRequest) {
    if (!username) {
      throw new Error('Sessão sem usuário. Entre novamente como cook.')
    }
    try {
      await updateRecipe(recipeId, payload, username)
      const media = mediaRef.current
      if (!recipe?.isPublished) {
        if (media.removeImage && !media.file) {
          try {
            await deleteRecipeImage(recipeId)
          } catch (err) {
            notify.error(mediaErrorMessage(err), 'Imagem')
            throw new Error(mediaErrorMessage(err))
          }
        } else if (media.file) {
          try {
            await uploadRecipeImage(recipeId, media.file)
          } catch (err) {
            notify.error(mediaErrorMessage(err), 'Imagem')
            throw new Error(mediaErrorMessage(err))
          }
        }
      }
      notify.success(`Receita "${payload.name}" atualizada.`, 'Edição')
      navigate('/cook/receitas', { replace: true })
    } catch (err) {
      if (err instanceof Error && err.message.includes('imagem')) {
        throw err
      }
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
          mediaRef={mediaRef}
        />
      ) : null}
    </div>
  )
}
