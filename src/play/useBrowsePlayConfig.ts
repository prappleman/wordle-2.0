import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { parseBrowsePlayConfig } from './browsePlayQuery'

/** URL overlays from Browse / hub pins (`mg`, `msr`, `tl`, `nd`, `lock`, `fab`). */
export function useBrowsePlayConfig() {
  const { search } = useLocation()
  return useMemo(() => parseBrowsePlayConfig(search), [search])
}
