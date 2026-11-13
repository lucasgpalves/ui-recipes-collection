import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ConfirmDialog } from './ConfirmDialog'

export type ConfirmTone = 'danger' | 'default'

export type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
}

type ConfirmRequest = ConfirmOptions & {
  resolve: (value: boolean) => void
}

type ConfirmApi = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmApi | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)
  const openRef = useRef(false)

  const close = useCallback((value: boolean) => {
    setRequest((current) => {
      if (!current) return null
      current.resolve(value)
      return null
    })
    openRef.current = false
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      if (openRef.current) {
        resolve(false)
        return
      }
      openRef.current = true
      setRequest({
        ...options,
        resolve,
      })
    })
  }, [])

  useEffect(() => {
    if (!request) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [request, close])

  const api = useMemo<ConfirmApi>(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      {request ? (
        <ConfirmDialog
          title={request.title ?? 'Confirmar'}
          message={request.message}
          confirmLabel={request.confirmLabel ?? 'Confirmar'}
          cancelLabel={request.cancelLabel ?? 'Cancelar'}
          tone={request.tone ?? 'danger'}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
      ) : null}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmApi {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return ctx
}
