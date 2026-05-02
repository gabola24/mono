import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGarage } from '../../hooks/useGarage'
import type { GarageFilter } from '../../stores/garageStore'
import ProjectCard from './ProjectCard'
import ProjectDetail from './ProjectDetail'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const FILTERS: { id: GarageFilter; label: string }[] = [
  { id: 'all', label: 'all' },
  { id: 'idea', label: 'idea' },
  { id: 'active', label: 'active' },
  { id: 'blocked', label: 'blocked' },
]

export default function GaragePanel({ isOpen, onClose }: Props) {
  const {
    filteredProjects,
    filter,
    selectedProjectId,
    isCreating,
    projects,
    setFilter,
    selectProject,
    createProject,
    updateProject,
    addNote,
    deleteProject,
  } = useGarage()

  const [titleInput, setTitleInput] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titleInput.trim() || isCreating) return
    await createProject(titleInput.trim())
    setTitleInput('')
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null

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
                &gt; GARAGE
              </h2>
              <button
                onClick={onClose}
                className="text-muse-text-dim hover:text-muse-text text-lg
                           font-mono transition-colors"
              >
                [x]
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                {selectedProject ? (
                  <ProjectDetail
                    key="detail"
                    project={selectedProject}
                    onBack={() => selectProject(null)}
                    onUpdate={updateProject}
                    onAddNote={addNote}
                    onDelete={deleteProject}
                  />
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Create project */}
                    <form onSubmit={handleCreate} className="space-y-2">
                      <input
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        placeholder="name a new project..."
                        disabled={isCreating}
                        className="w-full bg-muse-surface text-muse-text placeholder:text-muse-text-dim
                                   rounded-lg px-3 py-2 text-xs font-mono outline-none border border-muse-border
                                   focus:border-muse-accent/40 transition-colors disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={!titleInput.trim() || isCreating}
                        className="w-full rounded-lg py-2 text-xs font-mono font-medium
                                   disabled:opacity-20 hover:brightness-125 transition-all border"
                        style={{
                          background: 'var(--color-crt-amber)',
                          color: '#080808',
                          borderColor: 'var(--color-crt-amber)',
                        }}
                      >
                        {isCreating ? '[ creating... ]' : '[ new project ]'}
                      </button>
                    </form>

                    {/* Filter bar */}
                    <div className="flex gap-1.5">
                      {FILTERS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFilter(f.id)}
                          className="px-2 py-1 text-[10px] font-mono rounded border transition-colors"
                          style={
                            filter === f.id
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
                          [{f.label}]
                        </button>
                      ))}
                    </div>

                    {/* Project list */}
                    {filteredProjects.length === 0 && (
                      <p
                        className="text-center font-mono text-xs py-6"
                        style={{ color: 'var(--color-crt-amber)', opacity: 0.4 }}
                      >
                        no projects yet. start one above.
                      </p>
                    )}

                    {filteredProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onClick={() => selectProject(project.id)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
