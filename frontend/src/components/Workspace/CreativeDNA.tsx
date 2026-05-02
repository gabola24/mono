import { motion } from 'framer-motion'
import type { CreativeDNA as DNAType } from '../../stores/workspaceStore'

interface Props {
  dna: DNAType | null
  isLoading: boolean
  onRefresh: () => void
}

function DNASection({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div>
      <h4
        className="pixel-text text-[10px] uppercase tracking-[0.2em] mb-2"
        style={{ color: 'var(--color-pixel-gold)', opacity: 0.8 }}
      >
        {label}
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className="pixel-text text-[8px] px-2 py-1 rounded border border-muse-border
                       bg-muse-surface text-muse-text"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function CreativeDNA({ dna, isLoading, onRefresh }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.p
          className="pixel-text text-[10px]"
          style={{ color: 'var(--color-pixel-gold)' }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          analyzing creative dna...
        </motion.p>
      </div>
    )
  }

  if (!dna) {
    return (
      <div className="text-center py-8 space-y-3">
        <p
          className="pixel-text text-[10px]"
          style={{ color: 'var(--color-pixel-gold)', opacity: 0.5 }}
        >
          creative profile not generated yet
        </p>
        <button
          onClick={onRefresh}
          className="pixel-btn text-[10px]"
        >
          [analyze dna]
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats header */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <span className="pixel-text text-[8px] text-muse-text-dim">
            {dna.total_references} refs
          </span>
          <span className="pixel-text text-[8px] text-muse-text-dim">
            {dna.total_conversations} convos
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="pixel-btn-ghost text-[8px]"
        >
          [refresh]
        </button>
      </div>

      <DNASection label="themes" items={dna.themes} />
      <DNASection label="color tendencies" items={dna.color_tendencies} />
      <DNASection label="influences" items={dna.influences} />
      <DNASection label="patterns" items={dna.patterns} />

      {dna.creative_energy && (
        <div>
          <h4
            className="pixel-text text-[10px] uppercase tracking-[0.2em] mb-2"
            style={{ color: 'var(--color-pixel-gold)', opacity: 0.8 }}
          >
            energy
          </h4>
          <p className="pixel-text text-[8px] text-muse-text leading-loose">
            {dna.creative_energy}
          </p>
        </div>
      )}
    </div>
  )
}
