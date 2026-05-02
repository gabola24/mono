import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Project, ProjectNote } from '../../stores/garageStore'

const STATUSES = ['idea', 'active', 'paused', 'blocked', 'completed'] as const
const NOTE_TYPES = ['thought', 'finding', 'blocker', 'decision'] as const
const NOTE_ICONS: Record<string, string> = {
  thought: '·',
  finding: '◈',
  blocker: '⊘',
  decision: '✦',
}

interface Props {
  project: Project
  onBack: () => void
  onUpdate: (id: string, updates: Partial<Pick<Project, 'status' | 'priority'>>) => void
  onAddNote: (projectId: string, content: string, noteType: string) => void
  onDelete: (id: string) => void
}

export default function ProjectDetail({ project, onBack, onUpdate, onAddNote, onDelete }: Props) {
  const [noteInput, setNoteInput] = useState('')
  const [noteType, setNoteType] = useState<typeof NOTE_TYPES[number]>('thought')

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteInput.trim()) return
    onAddNote(project.id, noteInput.trim(), noteType)
    setNoteInput('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-5"
    >
      {/* Back + title */}
      <div>
        <button
          onClick={onBack}
          className="text-[10px] font-mono text-muse-text-dim hover:text-muse-text
                     transition-colors mb-2"
        >
          &lt; back
        </button>
        <h3
          className="font-mono text-sm"
          style={{ color: 'var(--color-crt-amber)' }}
        >
          {project.title}
        </h3>
        {project.description && (
          <p className="text-[11px] text-muse-text-dim font-mono mt-1">
            {project.description}
          </p>
        )}
      </div>

      {/* Status selector */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] font-mono text-muse-text-dim mb-2">
          status
        </p>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => onUpdate(project.id, { status: s })}
              className="px-2 py-1 text-[10px] font-mono rounded border transition-colors"
              style={
                project.status === s
                  ? {
                      color: '#080808',
                      background: 'var(--color-crt-amber)',
                      borderColor: 'var(--color-crt-amber)',
                    }
                  : {
                      color: 'var(--color-muse-text-dim)',
                      borderColor: 'var(--color-muse-border)',
                    }
              }
            >
              [{s}]
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] font-mono text-muse-text-dim mb-2">
          priority
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((p) => (
            <button
              key={p}
              onClick={() => onUpdate(project.id, { priority: p })}
              className="text-sm transition-opacity"
              style={{
                color: 'var(--color-crt-amber)',
                opacity: p <= project.priority ? 0.3 : 1,
              }}
            >
              {p <= (6 - project.priority) ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {/* Linked plans */}
      {project.plan_ids.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-mono text-muse-text-dim mb-2">
            linked plans ({project.plan_ids.length})
          </p>
          <div className="space-y-1">
            {project.plan_ids.map((pid) => (
              <div
                key={pid}
                className="text-[11px] font-mono text-muse-text-dim bg-muse-surface
                           rounded px-2 py-1 border border-muse-border truncate"
              >
                ◈ {pid.slice(0, 8)}...
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked references */}
      {project.reference_ids.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-mono text-muse-text-dim mb-2">
            linked refs ({project.reference_ids.length})
          </p>
          <div className="space-y-1">
            {project.reference_ids.map((rid) => (
              <div
                key={rid}
                className="text-[11px] font-mono text-muse-text-dim bg-muse-surface
                           rounded px-2 py-1 border border-muse-border truncate"
              >
                ◇ {rid.slice(0, 8)}...
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes timeline */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] font-mono text-muse-text-dim mb-2">
          notes ({project.notes.length})
        </p>

        {project.notes.length > 0 && (
          <div className="space-y-2 mb-3">
            {project.notes.map((note: ProjectNote) => (
              <div
                key={note.id}
                className="bg-muse-surface rounded-lg px-3 py-2 border border-muse-border"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: 'var(--color-crt-amber)' }}
                  >
                    {NOTE_ICONS[note.note_type] || '·'} {note.note_type}
                  </span>
                  <span className="text-[9px] font-mono text-muse-text-dim ml-auto opacity-60">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-muse-text">{note.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add note form */}
        <form onSubmit={handleAddNote} className="space-y-2">
          <div className="flex gap-1.5 mb-1">
            {NOTE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNoteType(t)}
                className="px-1.5 py-0.5 text-[9px] font-mono rounded border transition-colors"
                style={
                  noteType === t
                    ? {
                        color: '#080808',
                        background: 'var(--color-crt-amber)',
                        borderColor: 'var(--color-crt-amber)',
                      }
                    : {
                        color: 'var(--color-muse-text-dim)',
                        borderColor: 'var(--color-muse-border)',
                      }
                }
              >
                {NOTE_ICONS[t]} {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="add a note..."
              className="flex-1 bg-muse-surface text-muse-text placeholder:text-muse-text-dim
                         rounded-lg px-3 py-2 text-xs font-mono outline-none border border-muse-border
                         focus:border-muse-accent/40 transition-colors"
            />
            <button
              type="submit"
              disabled={!noteInput.trim()}
              className="px-3 py-2 text-[10px] font-mono rounded-lg border
                         disabled:opacity-20 hover:brightness-125 transition-all"
              style={{
                background: 'var(--color-crt-amber)',
                color: '#080808',
                borderColor: 'var(--color-crt-amber)',
              }}
            >
              [+]
            </button>
          </div>
        </form>
      </div>

      {/* Delete */}
      <button
        onClick={() => {
          onDelete(project.id)
          onBack()
        }}
        className="text-[10px] font-mono text-muse-text-dim hover:text-red-400
                   transition-colors mt-4"
      >
        [archive project]
      </button>
    </motion.div>
  )
}
