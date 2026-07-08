import posthog from 'posthog-js'

const KEY = import.meta.env.VITE_POSTHOG_KEY

export function initAnalytics(): void {
  if (!KEY) return
  posthog.init(KEY, {
    api_host: 'https://us.posthog.com',
    capture_pageview: true,
    autocapture: false,
    persistence: 'localStorage',
  })
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (!KEY) return
  posthog.capture(event, props)
}

export function identifyUser(userId: string, email?: string): void {
  if (!KEY) return
  posthog.identify(userId, email ? { email } : undefined)
}
