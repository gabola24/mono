import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBillingStore, isPro } from '../../stores/billingStore'
import { apiFetch } from '../../lib/api'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { tier, openUpsell } = useBillingStore()
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleManageSub = async () => {
    if (!isPro(tier)) {
      openUpsell()
      return
    }
    try {
      const res = await apiFetch('/api/billing/portal')
      if (res.ok) {
        const { url } = await res.json() as { url: string }
        window.open(url, '_blank')
      }
    } catch {
      // ignore
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await apiFetch('/api/account/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'zukuri-export.json'
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    try {
      await apiFetch('/api/account/delete', { method: 'POST' })
      localStorage.clear()
      window.location.reload()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="settings-backdrop"
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="settings-panel"
            className="fixed top-0 right-0 h-full z-50 flex flex-col bg-muse-surface border-l border-muse-border overflow-y-auto"
            style={{ width: 'min(320px, 85vw)' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-muse-border">
              <span className="pixel-text text-[10px] tracking-widest text-muse-text">SETTINGS</span>
              <button onClick={onClose} className="pixel-btn-ghost text-[10px]">✕</button>
            </div>

            <div className="flex-1 p-4 space-y-6">
              {/* Subscription */}
              <section>
                <p className="pixel-text text-[8px] text-muse-text-dim mb-3 tracking-widest">SUBSCRIPTION</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="pixel-text text-[10px] text-muse-text">Current plan:</span>
                  <span
                    className="pixel-text text-[10px]"
                    style={{ color: isPro(tier) ? 'var(--color-pixel-gold)' : 'var(--color-muse-text-dim)' }}
                  >
                    {tier === 'pro' ? 'PRO' : tier === 'pro_past_due' ? 'PRO (PAST DUE)' : 'FREE'}
                  </span>
                </div>
                {isPro(tier) ? (
                  <button onClick={handleManageSub} className="pixel-btn text-[9px] w-full">
                    MANAGE SUBSCRIPTION
                  </button>
                ) : (
                  <button
                    onClick={openUpsell}
                    className="pixel-btn text-[9px] w-full"
                    style={{
                      background: 'var(--color-pixel-pink)',
                      color: '#080808',
                      borderColor: 'var(--color-pixel-pink)',
                    }}
                  >
                    UPGRADE TO PRO — $5/MO
                  </button>
                )}
              </section>

              {/* Data */}
              <section>
                <p className="pixel-text text-[8px] text-muse-text-dim mb-3 tracking-widest">DATA</p>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="pixel-btn-ghost text-[9px] w-full mb-2 disabled:opacity-50"
                >
                  {exporting ? 'EXPORTING...' : 'EXPORT MY DATA'}
                </button>
              </section>

              {/* Danger zone */}
              <section>
                <p className="pixel-text text-[8px] text-muse-text-dim mb-3 tracking-widest" style={{ color: 'var(--color-pixel-pink)' }}>
                  DANGER ZONE
                </p>
                {confirmDelete && (
                  <p className="pixel-text text-[8px] text-pixel-pink mb-2">
                    This will permanently delete all your data. Click again to confirm.
                  </p>
                )}
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="pixel-btn text-[9px] w-full disabled:opacity-50"
                  style={{ borderColor: 'var(--color-pixel-pink)', color: 'var(--color-pixel-pink)' }}
                >
                  {deleting ? 'DELETING...' : confirmDelete ? 'CONFIRM DELETE ACCOUNT' : 'DELETE ACCOUNT'}
                </button>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
