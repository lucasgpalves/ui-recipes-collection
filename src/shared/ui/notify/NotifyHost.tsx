import type { NotifyItem } from './NotifyContext'
import styles from './notify.module.css'

type NotifyHostProps = {
  items: NotifyItem[]
  onDismiss: (id: string) => void
}

export function NotifyHost({ items, onDismiss }: NotifyHostProps) {
  if (items.length === 0) return null

  return (
    <div className={styles.host} aria-live="polite" aria-relevant="additions text">
      {items.map((item) => (
        <article
          key={item.id}
          className={`${styles.toast} ${styles[item.tone]}`}
          role={item.tone === 'error' ? 'alert' : 'status'}
        >
          <div className={styles.body}>
            <p className={styles.title}>{item.title}</p>
            <p className={styles.message}>{item.message}</p>
          </div>
          <button
            type="button"
            className={styles.close}
            aria-label="Fechar notificação"
            onClick={() => onDismiss(item.id)}
          >
            ×
          </button>
        </article>
      ))}
    </div>
  )
}
