// Vite supplies '/' locally and '/portfolio-project/' in the Pages build.
export function sitePath(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

export function currentPagePath() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const path = window.location.pathname
  const page = base && (path === base || path.startsWith(`${base}/`))
    ? path.slice(base.length) : path
  return page.replace(/\/+$/, '') || '/'
}
