import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Habit } from '../../stores/workspaceStore'

interface Props {
  habits: Habit[]
  onCheck: (id: string) => void
  onCreate: (name: string, frequency: string) => void
  onDelete: (id: string) => void
}

export default function HabitTracker({ habits, onCheck, onCreate, onDelete }: Props) {
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    onCreate(newName.trim(), 'daily')
    setNewName('')
    setShowForm(false)
  }

  return (
    <div className="space-y-3">
      {habits.length === 0 && !showForm && (
        <div className="text-center py-6">
          <p
            className="font-mono text-xs"
            style={{ color: 'var(--color-crt-amber)', opacity: 0.5 }}
          >
            no habits tracked yet
          </p>
        </div>
      )}

      {habits.map((habit) => (
        <motion.div
          key={habit.id}
          layout
          className="bg-muse-surface rounded-lg border border-muse-border p-3 group"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => onCheck(habit.id)}
              className="flex items-center gap-2 flex-1 text-left"
            >
              <span
                className="font-mono text-xs shrink-0"
                style={{
                  color: habit.completed_today
                    ? 'var(--color-crt-amber)'
                    : 'var(--color-muse-text-dim)',
                }}
              >
                {habit.completed_today ? '[✓]' : '[ ]'}
              </span>
              <span
                className={`font-mono text-xs ${
                  habit.completed_today ? 'text-muse-text' : 'text-muse-text-dim'
                }`}
              >
                {habit.name}
              </span>
            </button>

            <div className="flex items-center gap-2">
              {habit.streak > 0 && (
                <span
                  className="font-mono text-[10px]"
                  style={{ color: 'var(--color-crt-amber)' }}
                >
                  ✱{habit.streak}d
                </span>
              )}
              <button
                onClick={() => onDelete(habit.id)}
                className="text-muse-text-dim hover:text-red-400 text-xs font-mono
                           opacity-0 group-hover:opacity-100 transition-opacity"
              >
                [x]
              </button>
            </div>
          </div>
        </motion.div>
      ))}

      {showForm ? (
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="habit name..."
            autoFocus
            className="flex-1 bg-muse-surface text-muse-text placeholder:text-muse-text-dim
                       rounded-lg px-3 py-2 text-xs font-mono outline-none border border-muse-border
                       focus:border-muse-accent/40 transition-colors"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="font-mono text-xs px-3 py-2 rounded-lg border disabled:opacity-20
                       hover:brightness-125 transition-all"
            style={{
              background: 'var(--color-crt-amber)',
              color: '#080808',
              borderColor: 'var(--color-crt-amber)',
            }}
          >
            [+]
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="font-mono text-xs text-muse-text-dim hover:text-muse-text px-2"
          >
            esc
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full font-mono text-xs py-2 text-muse-text-dim
                     hover:text-[var(--color-crt-amber)] border border-dashed
                     border-muse-border hover:border-muse-accent/40 rounded-lg
                     transition-colors"
        >
          [+ new habit]
        </button>
      )}
    </div>
  )
}
