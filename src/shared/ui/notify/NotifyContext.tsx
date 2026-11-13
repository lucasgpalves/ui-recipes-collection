import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { NotifyHost } from './NotifyHost'

export type NotifyTone = 'success' | 'error' | 'info' | 'warning'

export type NotifyInput = {
  tone?: NotifyTone
  title?: string
  message: string
  durationMs?: number
}

export type NotifyItem = {
  id: string
  tone: NotifyTone
  title: string
  message: string
  durationMs: number
}

type NotifyApi = {
  push: (input: NotifyInput) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  dismiss: (id: string) => void
}

const DEFAULT_TITLES: Record<NotifyTone, string> = {
  success: 'Sucesso',
  error: 'Erro',
  info: 'Aviso',
  warning: 'Atenção',
}

const DEFAULT_DURATION: Record<NotifyTone, number> = {
  success: 3200,
  error: 5200,
  info: 4000,
  warning: 4500,
}

const NotifyContext = createContext<NotifyApi | null>(null)

let notifySeq = 0

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotifyItem[]>([])
  const timers = useRef(new Map<string, number>())

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer != null) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const push = useCallback(
    (input: NotifyInput) => {
      const tone = input.tone ?? 'info'
      const id = `notify-${Date.now()}-${notifySeq++}`
      const item: NotifyItem = {
        id,
        tone,
        title: input.title?.trim() || DEFAULT_TITLES[tone],
        message: input.message.trim(),
        durationMs: input.durationMs ?? DEFAULT_DURATION[tone],
      }

      setItems((current) => [...current, item].slice(-4))

      if (item.durationMs > 0) {
        const timer = window.setTimeout(() => dismiss(id), item.durationMs)
        timers.current.set(id, timer)
      }
    },
    [dismiss],
  )

  const api = useMemo<NotifyApi>(
    () => ({
      push,
      dismiss,
      success: (message, title) => push({ tone: 'success', message, title }),
      error: (message, title) => push({ tone: 'error', message, title }),
      info: (message, title) => push({ tone: 'info', message, title }),
      warning: (message, title) => push({ tone: 'warning', message, title }),
    }),
    [push, dismiss],
  )

  return (
    <NotifyContext.Provider value={api}>
      {children}
      <NotifyHost items={items} onDismiss={dismiss} />
    </NotifyContext.Provider>
  )
}

export function useNotify(): NotifyApi {
  const ctx = useContext(NotifyContext)
  if (!ctx) {
    throw new Error('useNotify must be used within NotifyProvider')
  }
  return ctx
}
