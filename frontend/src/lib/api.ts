import { track } from './analytics'

type TokenGetter = () => Promise<string | null>
type Handle402 = () => void

let _tokenGetter: TokenGetter | null = null
let _on402: Handle402 | null = null

export function registerTokenGetter(fn: TokenGetter): void {
  _tokenGetter = fn
}

export function register402Handler(fn: Handle402): void {
  _on402 = fn
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
  const response = await fetch(`${base}${path}`, { ...options, headers })
  if (response.status === 402) {
    track('paywall_hit', { path })
    if (_on402) _on402()
  }
  return response
}
