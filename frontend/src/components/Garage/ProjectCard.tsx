import { motion } from 'framer-motion'
import type { Project } from '../../stores/garageStore'

const STATUS_GLYPHS: Record<string, string> = {
  idea: '○',
  active: '◈',
  paused: '◇',
  blocked: '⊘',
  completed: '✦',
  archived: '─',
}

function priorityStars(p: number) {
  return '★'.repeat(Math.max(0, 6 - p)) + '☆'.repeat(Math.max(0, p - 1))
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

interface Props {
  project: Project
  onClick: () => void
}

export default function ProjectCard({ project, onClick }: Props) {
  const glyph = STATUS_GLYPHS[project.status] || '○'
  const planCount = project.plan_ids.length
  const refCount = project.reference_ids.length
  const noteCount = project.notes.length

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full text-left bg-muse-surface rounded-lg border border-muse-border
                 p-3.5 hover:border-[var(--color-crt-amber)]/30 transition-colors group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[9px] uppercase tracking-[0.15em] font-mono font-medium"
          style={{ color: 'var(--color-crt-amber)' }}
        >
          {glyph} {project.status}
        </span>
        <span
          className="text-[10px] font-mono"
          style={{ color: 'var(--color-crt-amber)', opacity: 0.7 }}
        >
          {priorityStars(project.priority)}
        </span>
      </div>

      <p className="text-xs font-mono text-muse-text truncate mb-1.5">
        {project.title}
      </p>

      <div className="flex items-center gap-2 text-[10px] font-mono text-muse-text-dim">
        <span>{planCount} plan{planCount !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{refCount} ref{refCount !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{noteCount} note{noteCount !== 1 ? 's' : ''}</span>
        <span className="ml-auto opacity-60">{timeAgo(project.updated_at)}</span>
      </div>
    </motion.button>
  )
}
