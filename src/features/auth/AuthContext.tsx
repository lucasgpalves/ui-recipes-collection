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
import {
  parseTokenClaims,
  roleFromToken,
  subjectFromToken,
  userIdFromToken,
} from '../../shared/auth/tokenClaims'
import { setMemoryToken, setUnauthorizedHandler } from '../../shared/api/client'
import { env } from '../../shared/config/env'
import { loginRequest, logoutRequest } from './api/login'
import { fetchAuthMe } from './api/session'

const TOKEN_KEY = 'receitou.auth.token'

type AuthContextValue = {
  token: string | null
  username: string | null
  userId: number | null
  role: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isCook: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Demo only: JWT em sessionStorage. API real não persiste JWT no JS (F-05). */
function readStoredDemoToken(): string | null {
  if (!env.useDemoApi) return null
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    if (!parseTokenClaims(raw)) {
      sessionStorage.removeItem(TOKEN_KEY)
      return null
    }
    return raw
  } catch {
    return null
  }
}

function clearTokenStorage() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialDemoToken = readStoredDemoToken()
  const [token, setToken] = useState<string | null>(() => initialDemoToken)
  const [username, setUsername] = useState<string | null>(() =>
    subjectFromToken(initialDemoToken),
  )
  const [userId, setUserId] = useState<number | null>(() => userIdFromToken(initialDemoToken))
  const [role, setRole] = useState<string | null>(() => roleFromToken(initialDemoToken))
  /** Invalida GET /auth/me em voo após login/logout (evita 401 apagar sessão nova). */
  const sessionEpochRef = useRef(0)

  const clearSession = useCallback(() => {
    clearTokenStorage()
    setMemoryToken(null)
    setToken(null)
    setUsername(null)
    setUserId(null)
    setRole(null)
  }, [])

  const applyIdentity = useCallback(
    (identity: { username: string | null; role: string | null; userId: number | null }) => {
      if (!identity.username || !identity.role) {
        clearSession()
        return
      }
      setToken(null)
      setMemoryToken(null)
      setUsername(identity.username)
      setUserId(identity.userId)
      setRole(identity.role)
    },
    [clearSession],
  )

  const logout = useCallback(() => {
    sessionEpochRef.current += 1
    void logoutRequest().catch(() => undefined)
    clearSession()
  }, [clearSession])

  const login = useCallback(
    async (usernameValue: string, password: string) => {
      const response = await loginRequest(usernameValue, password)

      if (env.useDemoApi) {
        // RF-UI-API-08: demo mantém JWT em sessionStorage.
        if (!response.token) {
          throw new Error('Login não retornou token')
        }
        sessionStorage.setItem(TOKEN_KEY, response.token)
        setMemoryToken(null)
        setToken(response.token)
        setUsername(response.username ?? subjectFromToken(response.token))
        setUserId(response.userId ?? userIdFromToken(response.token))
        setRole(response.role ?? roleFromToken(response.token))
        return
      }

      // RF-UI-API-05 / F-05: API real — identidade no JSON; JWT só no cookie HttpOnly.
      if (!response.username || !response.role) {
        throw new Error('Login não retornou identidade')
      }
      sessionEpochRef.current += 1
      clearTokenStorage()
      applyIdentity({
        username: response.username,
        role: response.role,
        userId: response.userId ?? null,
      })
    },
    [applyIdentity],
  )

  useEffect(() => {
    setUnauthorizedHandler(() => {
      sessionEpochRef.current += 1
      clearSession()
    })
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  useEffect(() => {
    if (env.useDemoApi) return

    let cancelled = false
    const bootEpoch = sessionEpochRef.current

    // Limpa JWT residual (incl. demo.*) — API real não usa sessionStorage para sessão.
    clearTokenStorage()
    setMemoryToken(null)

    void (async () => {
      try {
        const me = await fetchAuthMe()
        if (cancelled || bootEpoch !== sessionEpochRef.current) return
        applyIdentity({
          username: me.username,
          role: me.role,
          userId: me.userId,
        })
      } catch {
        if (!cancelled && bootEpoch === sessionEpochRef.current) clearSession()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [applyIdentity, clearSession])

  const isAdmin = role === 'ADMIN'
  const isCook = role === 'COOK'
  const isAuthenticated = Boolean(role && username)

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      username,
      userId,
      role,
      isAuthenticated,
      isAdmin,
      isCook,
      login,
      logout,
    }),
    [token, username, userId, role, isAuthenticated, isAdmin, isCook, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

/** Sessão opcional para superfícies públicas que degradam a anônimo fora do AuthProvider. */
export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext)
}

export function homePathForRole(role: string | null): string {
  if (role === 'ADMIN') return '/admin/usuarios'
  if (role === 'COOK') return '/cook/receitas'
  return '/'
}
