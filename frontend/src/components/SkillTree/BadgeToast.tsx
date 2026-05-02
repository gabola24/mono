import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SkillBadge } from '../../stores/skillTreeStore'

interface BadgeToastProps {
  badge: SkillBadge | null
  onDismiss: () => void
}

export default function BadgeToast({ badge, onDismiss }: BadgeToastProps) {
  useEffect(() => {
    if (badge) {
      const timer = setTimeout(onDismiss, 5000)
      return () => clearTimeout(timer)
    }
  }, [badge, onDismiss])

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div
            className="bg-[#0a0800] border border-amber-700/40 rounded-xl px-5 py-4 max-w-xs cursor-pointer"
            onClick={onDismiss}
            style={{
              boxShadow: '0 0 24px rgba(232,168,73,0.15), 0 0 4px rgba(232,168,73,0.1)',
            }}
          >
            <pre
              className="font-mono text-[10px] leading-tight mb-2 select-none text-center"
              style={{
                color: 'var(--color-crt-amber)',
                textShadow: '0 0 6px var(--color-crt-glow)',
              }}
            >
{`   ╔═══════╗
   ║  ✦✦✦  ║
   ╚═══════╝`}
            </pre>

            <p
              className="font-mono text-xs tracking-wider text-center"
              style={{
                color: 'var(--color-crt-amber)',
                textShadow: '0 0 4px var(--color-crt-glow)',
              }}
            >
              BADGE EARNED
            </p>
            <p
              className="font-mono text-sm mt-1 text-center font-medium"
              style={{ color: 'var(--color-muse-text)' }}
            >
              {badge.name}
            </p>
            <p
              className="font-mono text-[10px] mt-1 text-center"
              style={{ color: 'var(--color-muse-text-dim)' }}
            >
              {badge.description}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
