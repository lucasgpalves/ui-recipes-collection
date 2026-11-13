import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { roleFromToken } from '../../demo/demoToken'
import { setUnauthorizedHandler } from '../../shared/api/client'
import { loginRequest } from './api/login'

const TOKEN_KEY = 'receitou.auth.token'

type AuthContextValue = {
  token: string | null
  role: string | null
  isAuthenticated: boolean
  isAdmin: boolean
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
  const isAdmin = role === 'ADMIN'

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      role,
      isAuthenticated: Boolean(token),
      isAdmin,
      login,
      logout,
    }),
    [token, role, isAdmin, login, logout],
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
