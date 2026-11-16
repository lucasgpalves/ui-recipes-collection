import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { RecipeRequest } from '../../../../shared/api/types'
import { useNotify } from '../../../../shared/ui/notify'
import { useAuth } from '../../../auth'
import { RecipeForm, type RecipeFormMedia } from '../components/RecipeForm'
import { createRecipe, uploadRecipeImage } from '../api/recipes'
import styles from '../../../admin/shared/pages.module.css'

function mediaErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 413) return 'A imagem excede o tamanho máximo permitido (5 MiB).'
    if (err.status === 415) return 'Tipo de imagem não suportado. Use JPEG, PNG ou WebP.'
    if (err.status === 422) return 'Arquivo de imagem inválido.'
    if (err.status === 409) return 'Não é possível alterar a imagem desta receita.'
    if (err.status === 403) return 'Sem permissão para enviar a imagem.'
    return `Falha no envio da imagem (status ${err.status}).`
  }
  return 'Não foi possível enviar a imagem da receita.'
}

export function CookRecipeCreatePage() {
  const navigate = useNavigate()
  const notify = useNotify()
  const { username } = useAuth()
  const mediaRef = useRef<RecipeFormMedia>({ file: null, removeImage: false })

  async function handleCreate(payload: RecipeRequest) {
    if (!username) {
      throw new Error('Sessão sem usuário. Entre novamente como cook.')
    }
    try {
      const created = await createRecipe(payload, username)
      const recipeId = created?.id
      const media = mediaRef.current
      if (media.file && typeof recipeId === 'number') {
        try {
          await uploadRecipeImage(recipeId, media.file)
        } catch (err) {
          notify.error(mediaErrorMessage(err), 'Imagem')
          notify.success(
            `Receita "${payload.name}" cadastrada. Você pode reenviar a imagem na edição.`,
            'Cadastro parcial',
          )
          navigate(`/cook/receitas/${recipeId}/editar`, { replace: true })
          return
        }
      }
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

      <RecipeForm submitLabel="Cadastrar receita" onSubmit={handleCreate} mediaRef={mediaRef} />
    </div>
  )
}
