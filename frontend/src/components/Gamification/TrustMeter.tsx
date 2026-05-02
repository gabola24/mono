import { motion } from 'framer-motion'

interface Props {
  level: number
  totalRefs: number
}

const TRUST_LABELS = [
  'Stranger',
  'Acquaintance',
  'Familiar',
  'Trusted',
  'Bonded',
  'Attuned',
]

export default function TrustMeter({ level, totalRefs }: Props) {
  const labelIndex = Math.min(
    Math.floor(level * (TRUST_LABELS.length - 1)),
    TRUST_LABELS.length - 1
  )
  const label = TRUST_LABELS[labelIndex]

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between items-baseline mb-1">
          <span
            className="text-[10px] uppercase tracking-[0.15em] font-mono"
            style={{ color: 'var(--color-crt-amber)', opacity: 0.7 }}
          >
            {label}
          </span>
          <span className="text-[10px] text-muse-text-dim font-mono">
            {totalRefs} ref{totalRefs !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="h-1 bg-muse-border rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--color-crt-amber)' }}
            animate={{ width: `${level * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}
