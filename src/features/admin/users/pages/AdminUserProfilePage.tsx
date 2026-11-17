import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../../shared/api/client'
import { formatCpf } from '../../../../shared/lib/cpf'
import { formatMoney } from '../../../../shared/lib/money'
import type { JobReference, Restaurant, UserResponse } from '../../../../shared/api/types'
import { useConfirm } from '../../../../shared/ui/confirm'
import { useNotify } from '../../../../shared/ui/notify'
import { deleteReference, fetchReferencesByUserId } from '../../references/api/references'
import { fetchAdminRestaurants } from '../../restaurants/api/restaurants'
import { fetchUserById, reactivateUser, terminateUser } from '../api/users'
import styles from '../../shared/pages.module.css'

function formatPeriod(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt) return '—'
  return `${startsAt} — ${endsAt?.trim() ? endsAt : 'atual'}`
}

export function AdminUserProfilePage() {
  const { id } = useParams()
  const userId = Number(id)
  const notify = useNotify()
  const { confirm } = useConfirm()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [references, setReferences] = useState<JobReference[]>([])
  const [restaurantsByName, setRestaurantsByName] = useState<Map<string, Restaurant>>(new Map())
  const [loading, setLoading] = useState(true)
  const [loadingRefs, setLoadingRefs] = useState(false)
  const [terminating, setTerminating] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isCook = user?.roleName === 'COOK'

  const loadReferences = useCallback(async (cookUserId: number) => {
    setLoadingRefs(true)
    try {
      const [refs, restaurants] = await Promise.all([
        fetchReferencesByUserId(cookUserId),
        fetchAdminRestaurants(),
      ])
      setReferences(refs)
      const map = new Map<string, Restaurant>()
      for (const restaurant of restaurants) {
        if (restaurant.name) {
          map.set(restaurant.name.toLowerCase(), restaurant)
        }
      }
      setRestaurantsByName(map)
    } catch {
      notify.error('Não foi possível carregar a experiência profissional.', 'Falha ao carregar')
      setReferences([])
    } finally {
      setLoadingRefs(false)
    }
  }, [notify])

  useEffect(() => {
    if (!Number.isFinite(userId) || userId <= 0) {
      setError('Usuário inválido.')
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    fetchUserById(userId)
      .then((data) => {
        if (active) setUser(data)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o perfil.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId])

  useEffect(() => {
    if (!user || user.roleName !== 'COOK' || user.id == null) {
      setReferences([])
      return
    }
    void loadReferences(user.id)
  }, [user, loadReferences])

  async function handleTerminate() {
    if (!user?.id || user.terminatedAt) return
    const confirmed = await confirm({
      title: 'Desativar usuário',
      message: `Desativar o usuário "${user.name ?? user.id}"? O acesso fica encerrado até uma reativação.`,
      confirmLabel: 'Desativar',
      tone: 'danger',
    })
    if (!confirmed) return

    setTerminating(true)
    setError(null)
    try {
      await terminateUser(user.id)
      const refreshed = await fetchUserById(user.id)
      setUser(refreshed)
      notify.success(`Usuário "${user.name ?? user.id}" desativado.`, 'Desativação')
    } catch (err) {
      if (err instanceof ApiError) {
        const message = `Falha ao desativar (status ${err.status}).`
        setError(message)
        notify.error(message, 'Desativação')
      } else {
        setError('Não foi possível desativar o usuário.')
        notify.error('Não foi possível desativar o usuário.', 'Desativação')
      }
    } finally {
      setTerminating(false)
    }
  }

  async function handleReactivate() {
    if (!user?.id || !user.terminatedAt) return
    const confirmed = await confirm({
      title: 'Reativar usuário',
      message: `Reativar o usuário "${user.name ?? user.id}"? O acesso volta a ficar disponível.`,
      confirmLabel: 'Reativar',
      tone: 'default',
    })
    if (!confirmed) return

    setReactivating(true)
    setError(null)
    try {
      await reactivateUser(user.id)
      const refreshed = await fetchUserById(user.id)
      setUser(refreshed)
      notify.success(`Usuário "${user.name ?? user.id}" reativado.`, 'Reativação')
    } catch (err) {
      if (err instanceof ApiError) {
        const message = `Falha ao reativar (status ${err.status}).`
        setError(message)
        notify.error(message, 'Reativação')
      } else {
        setError('Não foi possível reativar o usuário.')
        notify.error('Não foi possível reativar o usuário.', 'Reativação')
      }
    } finally {
      setReactivating(false)
    }
  }

  async function handleDeleteReference(reference: JobReference) {
    if (reference.id == null || user?.id == null) return
    const label = reference.restaurantName ?? 'referência'
    const confirmed = await confirm({
      title: 'Excluir referência',
      message: `Excluir a experiência em "${label}"? Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    })
    if (!confirmed) return

    setDeletingId(reference.id)
    try {
      await deleteReference(reference.id)
      await loadReferences(user.id)
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

  const terminated = Boolean(user?.terminatedAt)

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.intro}>
        <div>
          <h1>Perfil</h1>
          <p>Visualização do cadastro do usuário.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin/usuarios" className={styles.ghostButton}>
            Listagem
          </Link>
          {user?.id != null && !terminated ? (
            <Link to={`/admin/usuarios/${user.id}/credenciais`} className={styles.primaryButton}>
              Criar acesso
            </Link>
          ) : null}
          {user?.id != null && !terminated ? (
            <Link to={`/admin/usuarios/${user.id}/editar`} className={styles.ghostButton}>
              Editar
            </Link>
          ) : null}
          {user?.id != null && !terminated ? (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={handleTerminate}
              disabled={terminating}
            >
              {terminating ? 'Desativando…' : 'Desativar'}
            </button>
          ) : null}
          {user?.id != null && terminated ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => void handleReactivate()}
              disabled={reactivating}
            >
              {reactivating ? 'Reativando…' : 'Reativar'}
            </button>
          ) : null}
        </div>
      </header>

      {loading ? <p className={styles.muted}>Carregando…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {user ? (
        <section className={styles.profileCard} aria-label="Identidade">
          <div className={styles.profileGrid}>
            <div>
              <span className={styles.fieldLabel}>Nome</span>
              <p className={styles.fieldValue}>{user.name ?? '—'}</p>
            </div>
            <div>
              <span className={styles.fieldLabel}>CPF</span>
              <p className={styles.fieldValue}>{user.cpf ? formatCpf(user.cpf) : '—'}</p>
            </div>
            <div>
              <span className={styles.fieldLabel}>Papel</span>
              <p className={styles.fieldValue}>{user.roleName ?? '—'}</p>
            </div>
            <div>
              <span className={styles.fieldLabel}>Salário</span>
              <p className={styles.fieldValue}>
                {user.salary != null ? formatMoney(user.salary) : '—'}
              </p>
            </div>
            <div>
              <span className={styles.fieldLabel}>Nome fantasia</span>
              <p className={styles.fieldValue}>{user.fantasyName || '—'}</p>
            </div>
            <div>
              <span className={styles.fieldLabel}>Situação</span>
              <p
                className={`${styles.fieldValue} ${
                  terminated ? styles.statusTerminated : styles.statusActive
                }`}
              >
                {terminated ? `Desativado em ${user.terminatedAt}` : 'Ativo'}
              </p>
            </div>
            <div>
              <span className={styles.fieldLabel}>Ingresso</span>
              <p className={styles.fieldValue}>{user.ingressedAt ?? '—'}</p>
            </div>
          </div>
        </section>
      ) : null}

      {user && isCook && user.id != null ? (
        <section className={styles.profileCard} aria-label="Experiência profissional">
          <div className={styles.sectionHeading}>
            <div>
              <h2>Experiência profissional</h2>
              <p>Referências de emprego deste cozinheiro.</p>
            </div>
            {!terminated ? (
              <Link
                to={`/admin/usuarios/${user.id}/referencias/nova`}
                className={styles.primaryButton}
              >
                Adicionar referência
              </Link>
            ) : null}
          </div>

          {loadingRefs ? <p className={styles.muted}>Carregando referências…</p> : null}
          {!loadingRefs && references.length === 0 ? (
            <p className={styles.muted}>Nenhuma experiência cadastrada ainda.</p>
          ) : null}

          {!loadingRefs && references.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Restaurante</th>
                    <th>Período</th>
                    <th>Contato</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {references.map((reference, index) => {
                    const refId = reference.id
                    const restaurant = reference.restaurantName
                      ? restaurantsByName.get(reference.restaurantName.toLowerCase())
                      : undefined
                    const restaurantLabel = [
                      reference.restaurantName ?? '—',
                      restaurant?.city,
                    ]
                      .filter(Boolean)
                      .join(' — ')
                    return (
                      <tr key={refId ?? `${reference.restaurantName}-${index}`}>
                        <td>
                          <strong>{restaurantLabel}</strong>
                        </td>
                        <td>{formatPeriod(reference.startsAt, reference.endsAt)}</td>
                        <td>{reference.contactNumber ?? '—'}</td>
                        <td>
                          <div className={styles.rowActions}>
                            {refId != null && !terminated ? (
                              <Link
                                to={`/admin/usuarios/${user.id}/referencias/${refId}/editar`}
                                className={styles.linkButton}
                              >
                                Editar
                              </Link>
                            ) : null}
                            {refId != null && !terminated ? (
                              <button
                                type="button"
                                className={styles.dangerButton}
                                onClick={() => void handleDeleteReference(reference)}
                                disabled={deletingId === refId}
                              >
                                {deletingId === refId ? 'Excluindo…' : 'Remover'}
                              </button>
                            ) : null}
                            {refId == null ? <span className={styles.muted}>Sem id</span> : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
