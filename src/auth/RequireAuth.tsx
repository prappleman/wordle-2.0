import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import type { AuthIntent, AuthMode } from './AuthModal'

type RequireAuthProps = {
  children: React.ReactNode
  mode?: AuthMode
  intent?: AuthIntent
}

export function RequireAuth({ children, mode = 'login', intent = 'account' }: RequireAuthProps) {
  const { isLoggedIn, promptAuth } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (isLoggedIn) return
    promptAuth({
      mode,
      intent,
      redirectTo: `${location.pathname}${location.search}`,
    })
  }, [intent, isLoggedIn, location.pathname, location.search, mode, promptAuth])

  if (!isLoggedIn) {
    return <Navigate to="/browse" replace />
  }

  return children
}
