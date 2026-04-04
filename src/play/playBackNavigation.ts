/** Query flag: play was opened from Browse; back returns to /browse instead of hub. */
export const PLAY_BACK_QUERY_KEY = 'pb'
export const PLAY_BACK_BROWSE_VALUE = 'browse'

export type PlayScreenBack = { to: string; label: string }

/** Append `pb=browse` to a `/play/...` href (merges with existing query). */
export function appendPlayBackBrowseToPlayHref(href: string): string {
  const q = href.indexOf('?')
  const path = q >= 0 ? href.slice(0, q) : href
  const existing = q >= 0 ? href.slice(q + 1) : ''
  const params = new URLSearchParams(existing)
  params.set(PLAY_BACK_QUERY_KEY, PLAY_BACK_BROWSE_VALUE)
  return `${path}?${params.toString()}`
}

export function browseSessionPlaySearch(): string {
  return new URLSearchParams({ [PLAY_BACK_QUERY_KEY]: PLAY_BACK_BROWSE_VALUE }).toString()
}

export function playScreenBackFromPathAndSearch(pathname: string, search: string): PlayScreenBack {
  const qs = search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(qs)

  if (pathname.startsWith('/play/my/')) {
    return { to: '/my-variants', label: '← My variants' }
  }

  if (pathname === '/play/browse-session') {
    if (params.get(PLAY_BACK_QUERY_KEY) === PLAY_BACK_BROWSE_VALUE) {
      return { to: '/browse', label: '← Browse variants' }
    }
    return { to: '/', label: '← Hub' }
  }

  if (params.get(PLAY_BACK_QUERY_KEY) === PLAY_BACK_BROWSE_VALUE) {
    return { to: '/browse', label: '← Browse variants' }
  }

  return { to: '/', label: '← Hub' }
}
