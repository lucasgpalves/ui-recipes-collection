import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  roleFromToken,
  subjectFromToken,
  userIdFromToken,
} from '../../shared/auth/tokenClaims'
import { setMemoryToken, setUnauthorizedHandler } from '../../shared/api/client'
import { env } from '../../shared/config/env'
import { fetchAuthMe, loginRequest, logoutRequest } from './api/login'

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

function readStoredDemoToken(): string | null {
  if (!env.useDemoApi) return null
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredDemoToken())
  const [username, setUsername] = useState<string | null>(() => subjectFromToken(readStoredDemoToken()))
  const [userId, setUserId] = useState<number | null>(() => userIdFromToken(readStoredDemoToken()))
  const [role, setRole] = useState<string | null>(() => roleFromToken(readStoredDemoToken()))
  const [sessionReady, setSessionReady] = useState(env.useDemoApi)

  const clearSession = useCallback(() => {
    if (env.useDemoApi) {
      try {
        sessionStorage.removeItem(TOKEN_KEY)
      } catch {
        /* ignore */
      }
    }
    setMemoryToken(null)
    setToken(null)
    setUsername(null)
    setUserId(null)
    setRole(null)
  }, [])

  const logout = useCallback(() => {
    void logoutRequest().catch(() => undefined)
    clearSession()
  }, [clearSession])

  const login = useCallback(async (usernameValue: string, password: string) => {
    const response = await loginRequest(usernameValue, password)

    if (env.useDemoApi) {
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

    // F-05: API real — JWT só no cookie HttpOnly; identidade vem no body (sem token).
    const nextUsername = response.username ?? null
    const nextRole = response.role ?? null
    const nextUserId = response.userId ?? null
    if (!nextUsername || !nextRole) {
      throw new Error('Login não retornou identidade da sessão')
    }
    setMemoryToken(null)
    setToken('cookie-session')
    setUsername(nextUsername)
    setUserId(nextUserId)
    setRole(nextRole)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
    })
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  // F-05: restaura sessão a partir do cookie HttpOnly (API real).
  useEffect(() => {
    if (env.useDemoApi) return
    let cancelled = false
    ;(async () => {
      try {
        const me = await fetchAuthMe()
        if (cancelled) return
        setUsername(me.username)
        setUserId(me.userId)
        setRole(me.role)
        // Marcador de sessão sem JWT em storage (cookie HttpOnly).
        setToken('cookie-session')
      } catch {
        if (!cancelled) clearSession()
      } finally {
        if (!cancelled) setSessionReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [clearSession])

  const isAdmin = role === 'ADMIN'
  const isCook = role === 'COOK'
  const isAuthenticated = Boolean(token) || (Boolean(username) && Boolean(role))

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      username,
      userId,
      role,
      isAuthenticated: sessionReady ? isAuthenticated : false,
      isAdmin,
      isCook,
      login,
      logout,
    }),
    [token, username, userId, role, isAuthenticated, sessionReady, isAdmin, isCook, login, logout],
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

export function homePathForRole(role: string | null): string {
  if (role === 'ADMIN') return '/admin/usuarios'
  if (role === 'COOK') return '/cook/receitas'
  return '/'
}
