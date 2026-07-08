import { create } from 'zustand'
import { apiFetch } from '../lib/api'

export type SubscriptionTier = 'free' | 'pro' | 'pro_past_due' | 'pro_canceled'

interface BillingState {
  tier: SubscriptionTier | null
  upsellOpen: boolean
  loadTier: () => Promise<void>
  openUpsell: () => void
  closeUpsell: () => void
}

export const useBillingStore = create<BillingState>((set) => ({
  tier: null,
  upsellOpen: false,
  loadTier: async () => {
    try {
      const res = await apiFetch('/api/me')
      if (res.ok) {
        const data = await res.json() as { subscription_tier: SubscriptionTier }
        set({ tier: data.subscription_tier ?? 'free' })
      }
    } catch {
      set({ tier: 'free' })
    }
  },
  openUpsell: () => set({ upsellOpen: true }),
  closeUpsell: () => set({ upsellOpen: false }),
}))

export function isPro(tier: SubscriptionTier | null): boolean {
  return tier === 'pro'
}
