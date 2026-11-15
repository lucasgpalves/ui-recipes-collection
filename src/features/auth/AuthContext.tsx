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
  parseTokenClaims,
  roleFromToken,
  subjectFromToken,
  userIdFromToken,
} from '../../shared/auth/tokenClaims'
import { setMemoryToken, setUnauthorizedHandler } from '../../shared/api/client'
import { loginRequest, logoutRequest } from './api/login'

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

/** RF-UI-API-06 / RF-UI-API-08: lê JWT de sessionStorage; limpa se ausente/inválido/expirado/demo.* em API real. */
function readStoredToken(): string | null {
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken())
  const [username, setUsername] = useState<string | null>(() => subjectFromToken(readStoredToken()))
  const [userId, setUserId] = useState<number | null>(() => userIdFromToken(readStoredToken()))
  const [role, setRole] = useState<string | null>(() => roleFromToken(readStoredToken()))

  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
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

    // RF-UI-API-05 / RF-UI-API-08: JWT (real ou demo) em sessionStorage + estado de auth.
    if (!response.token) {
      throw new Error('Login não retornou token')
    }
    sessionStorage.setItem(TOKEN_KEY, response.token)
    setMemoryToken(null)
    setToken(response.token)
    setUsername(response.username ?? subjectFromToken(response.token))
    setUserId(response.userId ?? userIdFromToken(response.token))
    setRole(response.role ?? roleFromToken(response.token))
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
    })
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  const isAdmin = role === 'ADMIN'
  const isCook = role === 'COOK'
  const isAuthenticated = Boolean(token)

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

export function homePathForRole(role: string | null): string {
  if (role === 'ADMIN') return '/admin/usuarios'
  if (role === 'COOK') return '/cook/receitas'
  return '/'
}
