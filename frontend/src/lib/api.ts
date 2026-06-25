type TokenGetter = () => Promise<string | null>
let _tokenGetter: TokenGetter | null = null

export function registerTokenGetter(fn: TokenGetter): void {
  _tokenGetter = fn
}

/**
 * Drop-in replacement for fetch that:
 * - Prefixes with VITE_API_URL when set (prod cross-domain)
 * - Injects Authorization: Bearer <token> from Clerk when available
 * - Auto-sets Content-Type: application/json for non-FormData bodies
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const base = import.meta.env.VITE_API_URL ?? ''
  const token = _tokenGetter ? await _tokenGetter() : null
  const headers = new Headers(options?.headers)
  if (
    options?.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(`${base}${path}`, { ...options, headers })
}
