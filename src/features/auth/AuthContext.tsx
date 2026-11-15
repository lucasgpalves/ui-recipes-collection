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
import { setUnauthorizedHandler } from '../../shared/api/client'
import { loginRequest } from './api/login'

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

function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken())

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginRequest(username, password)
    if (!response.token) {
      throw new Error('Login não retornou token')
    }
    sessionStorage.setItem(TOKEN_KEY, response.token)
    setToken(response.token)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      sessionStorage.removeItem(TOKEN_KEY)
      setToken(null)
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const role = roleFromToken(token)
  const username = subjectFromToken(token)
  const userId = userIdFromToken(token)
  const isAdmin = role === 'ADMIN'
  const isCook = role === 'COOK'

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      username,
      userId,
      role,
      isAuthenticated: Boolean(token),
      isAdmin,
      isCook,
      login,
      logout,
    }),
    [token, username, userId, role, isAdmin, isCook, login, logout],
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
