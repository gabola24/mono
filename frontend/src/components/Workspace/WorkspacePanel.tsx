import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspace } from '../../hooks/useWorkspace'
import PlanCard from './PlanCard'
import HabitTracker from './HabitTracker'
import CreativeDNA from './CreativeDNA'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const TABS = [
  { id: 'plans' as const, label: 'plans' },
  { id: 'habits' as const, label: 'habits' },
  { id: 'dna' as const, label: 'dna' },
]

export default function WorkspacePanel({ isOpen, onClose }: Props) {
  const {
    plans,
    habits,
    dna,
    activeTab,
    isGenerating,
    isLoadingDNA,
    setTab,
    generatePlan,
    toggleStep,
    deletePlan,
    createHabit,
    checkHabit,
    deleteHabit,
    fetchDNA,
  } = useWorkspace()

  const [planInput, setPlanInput] = useState('')

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planInput.trim() || isGenerating) return
    await generatePlan(planInput.trim())
    setPlanInput('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed left-0 top-0 bottom-0 w-full max-w-md bg-muse-bg
                        z-50 border-r border-muse-border flex flex-col overflow-hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-muse-border">
              <h2
                className="font-mono text-sm tracking-wider"
                style={{ color: 'var(--color-crt-amber)' }}
              >
                &gt; WORKSPACE
              </h2>
              <button
                onClick={onClose}
                className="text-muse-text-dim hover:text-muse-text text-lg
                           font-mono transition-colors"
              >
                [x]
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-muse-border">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setTab(tab.id)
                    if (tab.id === 'dna' && !dna) fetchDNA()
                  }}
                  className={`flex-1 py-2.5 font-mono text-xs tracking-wider transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-b border-[var(--color-crt-amber)]'
                        : 'text-muse-text-dim hover:text-muse-text'
                    }`}
                  style={activeTab === tab.id ? { color: 'var(--color-crt-amber)' } : undefined}
                >
                  [{tab.label}]
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === 'plans' && (
                <div className="space-y-4">
                  {/* Plan generator */}
                  <form onSubmit={handleGeneratePlan} className="space-y-2">
                    <input
                      value={planInput}
                      onChange={(e) => setPlanInput(e.target.value)}
                      placeholder="describe an idea to structure..."
                      disabled={isGenerating}
                      className="w-full bg-muse-surface text-muse-text placeholder:text-muse-text-dim
                                 rounded-lg px-3 py-2 text-xs font-mono outline-none border border-muse-border
                                 focus:border-muse-accent/40 transition-colors disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!planInput.trim() || isGenerating}
                      className="w-full rounded-lg py-2 text-xs font-mono font-medium
                                 disabled:opacity-20 hover:brightness-125 transition-all border"
                      style={{
                        background: 'var(--color-crt-amber)',
                        color: '#080808',
                        borderColor: 'var(--color-crt-amber)',
                      }}
                    >
                      {isGenerating ? '[ structuring... ]' : '[ generate plan ]'}
                    </button>
                  </form>

                  {plans.length === 0 && !isGenerating && (
                    <p
                      className="text-center font-mono text-xs py-6"
                      style={{ color: 'var(--color-crt-amber)', opacity: 0.4 }}
                    >
                      no plans yet. describe an idea above.
                    </p>
                  )}

                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      onToggleStep={toggleStep}
                      onDelete={deletePlan}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'habits' && (
                <HabitTracker
                  habits={habits}
                  onCheck={checkHabit}
                  onCreate={createHabit}
                  onDelete={deleteHabit}
                />
              )}

              {activeTab === 'dna' && (
                <CreativeDNA dna={dna} isLoading={isLoadingDNA} onRefresh={fetchDNA} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
