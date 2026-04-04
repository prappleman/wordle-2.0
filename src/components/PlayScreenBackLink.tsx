import { Link, useLocation } from 'react-router-dom'
import { playScreenBackFromPathAndSearch } from '../play/playBackNavigation'

export function PlayScreenBackLink({ className }: { className: string }) {
  const { pathname, search } = useLocation()
  const { to, label } = playScreenBackFromPathAndSearch(pathname, search)
  return (
    <Link to={to} className={className}>
      {label}
    </Link>
  )
}

export function usePlayScreenBack() {
  const { pathname, search } = useLocation()
  return playScreenBackFromPathAndSearch(pathname, search)
}
