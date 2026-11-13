import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import type { JobReference } from '../../../../shared/api/types'
import { useConfirm } from '../../../../shared/ui/confirm'
import { useNotify } from '../../../../shared/ui/notify'
import { deleteReference, fetchAdminReferences } from '../api/references'
import styles from '../../shared/pages.module.css'

export function AdminReferencesListPage() {
  const notify = useNotify()
  const { confirm } = useConfirm()
  const [references, setReferences] = useState<JobReference[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadReferences = useCallback(async () => {
    setLoading(true)
    try {
      setReferences(await fetchAdminReferences())
    } catch {
      notify.error('Não foi possível carregar as referências.', 'Falha ao carregar')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    void loadReferences()
  }, [loadReferences])

  async function handleDelete(reference: JobReference) {
    if (reference.id == null) return
    const label = `${reference.user?.name ?? 'Cozinheiro'} @ ${reference.restaurantName ?? '—'}`
    const confirmed = await confirm({
      title: 'Excluir referência',
      message: `Excluir a referência "${label}"? Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    })
    if (!confirmed) return

    setDeletingId(reference.id)
    try {
      await deleteReference(reference.id)
      setReferences(await fetchAdminReferences())
      notify.success(`Referência "${label}" excluída.`, 'Exclusão')
    } catch (err) {
      if (err instanceof ApiError) {
        notify.error(`Falha ao excluir (status ${err.status}).`, 'Exclusão')
      } else {
        notify.error('Não foi possível excluir a referência.', 'Exclusão')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Referências de emprego</h1>
          <p>
            Visão global (atalho). A jornada principal é o{' '}
            <Link to="/admin/usuarios" className={styles.inlineLink}>
              perfil do COOK
            </Link>
            .
          </p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/usuarios" className={styles.primaryButton}>
            Ir aos usuários
          </Link>
          <Link to="/admin/referencias/nova" className={styles.ghostButton}>
            Nova referência
          </Link>
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {!loading && references.length === 0 ? (
        <p className={styles.muted}>Nenhuma referência cadastrada ainda.</p>
      ) : null}

      {references.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cozinheiro</th>
                <th>Restaurante</th>
                <th>Período</th>
                <th>Contato</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {references.map((reference, index) => {
                const id = reference.id
                const period = [reference.startsAt, reference.endsAt || 'atual']
                  .filter(Boolean)
                  .join(' — ')
                const profileHref =
                  reference.userId != null ? `/admin/usuarios/${reference.userId}` : null
                const editHref =
                  reference.userId != null && id != null
                    ? `/admin/usuarios/${reference.userId}/referencias/${id}/editar`
                    : id != null
                      ? `/admin/referencias/${id}/editar`
                      : null
                return (
                  <tr key={id ?? `${reference.restaurantName}-${index}`}>
                    <td>
                      {profileHref ? (
                        <Link to={profileHref} className={styles.inlineLink}>
                          <strong>{reference.user?.name ?? '—'}</strong>
                        </Link>
                      ) : (
                        <strong>{reference.user?.name ?? '—'}</strong>
                      )}
                      {reference.user?.roleName ? (
                        <div className={styles.muted}>{reference.user.roleName}</div>
                      ) : null}
                    </td>
                    <td>{reference.restaurantName ?? '—'}</td>
                    <td>{period || '—'}</td>
                    <td>{reference.contactNumber ?? '—'}</td>
                    <td>
                      <div className={styles.rowActions}>
                        {editHref ? (
                          <Link to={editHref} className={styles.linkButton}>
                            Editar
                          </Link>
                        ) : (
                          <span className={styles.muted}>Sem id</span>
                        )}
                        {id != null ? (
                          <button
                            type="button"
                            className={styles.dangerButton}
                            onClick={() => void handleDelete(reference)}
                            disabled={deletingId === id}
                          >
                            {deletingId === id ? 'Excluindo…' : 'Excluir'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
