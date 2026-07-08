import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBillingStore } from '../stores/billingStore'
import { apiFetch } from '../lib/api'
import { track } from '../lib/analytics'

export default function UpsellModal() {
  const { upsellOpen, closeUpsell } = useBillingStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    track('upgrade_clicked')
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/billing/checkout', { method: 'POST' })
      if (!res.ok) {
        setError('Billing unavailable. Try again later.')
        return
      }
      const { url } = await res.json() as { url: string }
      if (url) window.location.href = url
    } catch {
      setError('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {upsellOpen && (
        <motion.div
          key="upsell-backdrop"
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(5, 4, 10, 0.85)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeUpsell}
        >
          <motion.div
            key="upsell-panel"
            className="bg-muse-surface border-2 p-8 max-w-xs mx-4 text-center"
            style={{ borderColor: 'var(--color-pixel-pink)' }}
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={e => e.stopPropagation()}
          >
            <p
              className="pixel-text text-[13px] mb-1"
              style={{ color: 'var(--color-pixel-pink)', textShadow: '0 0 8px var(--color-muse-accent-glow)' }}
            >
              UPGRADE TO PRO
            </p>
            <p className="pixel-text text-[8px] text-muse-text-dim mb-5">
              $5 / month · cancel anytime
            </p>

            <ul className="text-left pixel-text text-[8px] text-muse-text-dim mb-6 space-y-1.5">
              <li style={{ color: 'var(--color-pixel-gold)' }}>◈ 500 messages / day</li>
              <li>◈ Full mind graph (unlimited nodes)</li>
              <li>◈ Arcade games</li>
              <li>◈ Workspace — plans &amp; habits</li>
              <li>◈ Garage — project tracker</li>
              <li>◈ References upload</li>
              <li>◈ All companion stages</li>
            </ul>

            {error && (
              <p className="pixel-text text-[8px] text-pixel-pink mb-3">{error}</p>
            )}

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="pixel-btn w-full text-[10px] mb-3 disabled:opacity-50"
              style={{
                background: 'var(--color-pixel-pink)',
                color: '#080808',
                borderColor: 'var(--color-pixel-pink)',
              }}
            >
              {loading ? 'LOADING...' : 'UPGRADE NOW'}
            </button>
            <button
              onClick={closeUpsell}
              className="pixel-btn-ghost w-full text-[9px]"
            >
              STAY FREE
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
