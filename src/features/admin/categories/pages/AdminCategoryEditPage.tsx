import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { Category, CategoryRequest } from '../../../../shared/api/types'
import { CategoryForm } from '../components/CategoryForm'
import { fetchCategoryById, updateCategory } from '../api/categories'
import styles from '../../shared/pages.module.css'

export function AdminCategoryEditPage() {
  const { id } = useParams()
  const categoryId = Number(id)
  const navigate = useNavigate()
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      setError('Categoria inválida.')
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    fetchCategoryById(categoryId)
      .then((data) => {
        if (active) setCategory(data)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar a categoria.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [categoryId])

  const initial = useMemo<Partial<CategoryRequest> | undefined>(() => {
    if (!category) return undefined
    return {
      name: category.name ?? '',
      description: category.description ?? '',
    }
  }, [category])

  async function handleUpdate(payload: CategoryRequest) {
    try {
      await updateCategory(categoryId, payload)
      navigate('/admin/categorias', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(`Falha ao atualizar (status ${err.status}).`)
      }
      throw new Error('Não foi possível atualizar a categoria.')
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Editar categoria</h1>
          <p>Atualização via PUT /categories/{'{id}'}.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/categorias" className={styles.ghostButton}>
            Listagem
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {!loading && category && initial ? (
        <CategoryForm
          key={category.id}
          initial={initial}
          submitLabel="Salvar alterações"
          onSubmit={handleUpdate}
        />
      ) : null}
    </div>
  )
}
