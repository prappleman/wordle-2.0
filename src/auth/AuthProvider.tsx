import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthModal, type AuthIntent, type AuthMode } from './AuthModal'

export type AuthUser = {
  email: string
}

export type AuthPromptOptions = {
  mode?: AuthMode
  intent?: AuthIntent
  redirectTo?: string
  onSuccess?: () => void
}

type AuthContextValue = {
  user: AuthUser | null
  isLoggedIn: boolean
  promptAuth: (options?: AuthPromptOptions) => void
  closeAuth: () => void
  logout: () => void
}

const AUTH_STORAGE_KEY = 'wordle-auth-session-v1'

const ACCOUNT_PATH_PREFIXES = ['/settings', '/my-variants', '/create', '/play/my']

function readStoredAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed &&
      typeof parsed === 'object' &&
      'email' in parsed &&
      typeof (parsed as { email: unknown }).email === 'string'
    ) {
      const email = (parsed as AuthUser).email.trim()
      if (email) return { email }
    }
  } catch {
    /* ignore */
  }
  return null
}

function writeStoredAuth(user: AuthUser | null) {
  try {
    if (user == null) localStorage.removeItem(AUTH_STORAGE_KEY)
    else localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  } catch {
    /* ignore */
  }
}

function isAccountPath(pathname: string): boolean {
  if (pathname === '/') return true
  return ACCOUNT_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [user, setUser] = useState<AuthUser | null>(() => readStoredAuth())
  const [prompt, setPrompt] = useState<{
    mode: AuthMode
    intent?: AuthIntent
    redirectTo?: string
  } | null>(null)
  const pendingActionRef = useRef<(() => void) | null>(null)

  const closeAuth = useCallback(() => {
    pendingActionRef.current = null
    setPrompt(null)
  }, [])

  const promptAuth = useCallback((options?: AuthPromptOptions) => {
    pendingActionRef.current = options?.onSuccess ?? null
    setPrompt({
      mode: options?.mode ?? 'login',
      intent: options?.intent,
      redirectTo: options?.redirectTo,
    })
  }, [])

  const completeAuth = useCallback(
    (email: string) => {
      const next: AuthUser = { email: email.trim().toLowerCase() }
      writeStoredAuth(next)
      const dest = prompt?.redirectTo
      const extra = pendingActionRef.current
      pendingActionRef.current = null
      flushSync(() => {
        setUser(next)
        setPrompt(null)
      })
      extra?.()
      if (dest) navigate(dest)
    },
    [navigate, prompt?.redirectTo],
  )

  const logout = useCallback(() => {
    writeStoredAuth(null)
    setUser(null)
    closeAuth()
    if (isAccountPath(pathname)) navigate('/browse')
  }, [closeAuth, navigate, pathname])

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: user != null,
      promptAuth,
      closeAuth,
      logout,
    }),
    [user, promptAuth, closeAuth, logout],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={prompt != null}
        mode={prompt?.mode ?? 'login'}
        intent={prompt?.intent}
        onModeChange={(mode) => setPrompt((prev) => (prev ? { ...prev, mode } : prev))}
        onClose={closeAuth}
        onSubmit={completeAuth}
      />
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx == null) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
