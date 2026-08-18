import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { playScreenBackFromPathAndSearch } from '../play/playBackNavigation'

export function PlayScreenBackLink({ className }: { className: string }) {
  const { pathname, search } = useLocation()
  const { isLoggedIn } = useAuth()
  const { to, label } = playScreenBackFromPathAndSearch(pathname, search, isLoggedIn)
  return (
    <Link to={to} className={className}>
      {label}
    </Link>
  )
}

export function usePlayScreenBack() {
  const { pathname, search } = useLocation()
  const { isLoggedIn } = useAuth()
  return playScreenBackFromPathAndSearch(pathname, search, isLoggedIn)
}
