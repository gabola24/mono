import { motion } from 'framer-motion'
import type { Plan } from '../../stores/workspaceStore'

interface Props {
  plan: Plan
  onToggleStep: (planId: string, stepOrder: number, done: boolean) => void
  onDelete: (id: string) => void
}

export default function PlanCard({ plan, onToggleStep, onDelete }: Props) {
  const completed = plan.steps.filter((s) => s.done).length
  const total = plan.steps.length
  const progress = total > 0 ? (completed / total) * 100 : 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-muse-surface rounded-lg border border-muse-border p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4
            className="font-mono text-sm font-medium"
            style={{ color: 'var(--color-crt-amber)' }}
          >
            {plan.title}
          </h4>
          <p className="text-xs text-muse-text-dim mt-1 font-mono">{plan.summary}</p>
        </div>
        <button
          onClick={() => onDelete(plan.id)}
          className="text-muse-text-dim hover:text-red-400 text-xs font-mono transition-colors shrink-0"
        >
          [x]
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-muse-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--color-crt-amber)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-1.5">
        {plan.steps.map((step) => (
          <button
            key={step.order}
            onClick={() => onToggleStep(plan.id, step.order, !step.done)}
            className="flex items-start gap-2 w-full text-left group"
          >
            <span
              className="font-mono text-xs mt-0.5 shrink-0"
              style={{ color: step.done ? 'var(--color-crt-amber)' : 'var(--color-muse-text-dim)' }}
            >
              {step.done ? '[✓]' : '[ ]'}
            </span>
            <div className="flex-1 min-w-0">
              <span
                className={`text-xs font-mono block ${
                  step.done ? 'line-through text-muse-text-dim' : 'text-muse-text'
                }`}
              >
                {step.title}
              </span>
              <span className="text-[10px] text-muse-text-dim font-mono block mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {step.description}
              </span>
            </div>
          </button>
        ))}
      </div>

      <p className="text-[10px] text-muse-text-dim font-mono text-right">
        {completed}/{total} complete
      </p>
    </motion.div>
  )
}
