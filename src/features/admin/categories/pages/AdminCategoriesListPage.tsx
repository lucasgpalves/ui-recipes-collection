import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { Category } from '../../../../shared/api/types'
import { useConfirm } from '../../../../shared/ui/confirm'
import { useNotify } from '../../../../shared/ui/notify'
import { deleteCategory, fetchAdminCategories } from '../api/categories'
import styles from '../../shared/pages.module.css'

export function AdminCategoriesListPage() {
  const notify = useNotify()
  const { confirm } = useConfirm()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminCategories()
      setCategories(data)
    } catch {
      notify.error('Não foi possível carregar as categorias.', 'Falha ao carregar')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  async function handleDelete(category: Category) {
    const confirmed = await confirm({
      title: 'Excluir categoria',
      message: `Excluir a categoria "${category.name ?? category.id}"? Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    })
    if (!confirmed) return

    setDeletingId(category.id)
    try {
      await deleteCategory(category.id)
      const refreshed = await fetchAdminCategories()
      setCategories(refreshed)
      notify.success(`Categoria "${category.name ?? category.id}" excluída.`, 'Exclusão')
    } catch (err) {
      if (err instanceof ApiError) {
        notify.error(`Falha ao excluir (status ${err.status}).`, 'Exclusão')
      } else {
        notify.error('Não foi possível excluir a categoria.', 'Exclusão')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Categorias</h1>
          <p>Gerencie as categorias usadas no catálogo público de receitas.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/categorias/nova" className={styles.primaryButton}>
            Nova categoria
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {!loading && categories.length === 0 ? (
        <p className={styles.muted}>Nenhuma categoria cadastrada ainda.</p>
      ) : null}

      {categories.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <strong>{category.name ?? '—'}</strong>
                  </td>
                  <td>{category.description || '—'}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <Link
                        to={`/admin/categorias/${category.id}/editar`}
                        className={styles.linkButton}
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => void handleDelete(category)}
                        disabled={deletingId === category.id}
                      >
                        {deletingId === category.id ? 'Excluindo…' : 'Excluir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
