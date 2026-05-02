import { useCallback, useEffect } from 'react'
import { useGarageStore, type Project } from '../stores/garageStore'
import { useCompanionStore } from '../stores/companionStore'

export function useGarage() {
  const store = useGarageStore()
  const addXp = useCompanionStore((s) => s.addXp)
  const setMood = useCompanionStore((s) => s.setMood)

  const { setProjects, addProject, updateProject: storeUpdateProject, removeProject, setCreating } = store

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects')
    if (res.ok) setProjects(await res.json())
  }, [setProjects])

  const createProject = useCallback(
    async (title: string, description = '') => {
      setCreating(true)
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description }),
        })
        if (res.ok) {
          const project: Project = await res.json()
          addProject(project)
          addXp(15)
          setMood('celebrating')
          setTimeout(() => setMood('idle'), 1200)
          return project
        }
      } finally {
        setCreating(false)
      }
    },
    [setCreating, addProject, addXp, setMood]
  )

  const updateProject = useCallback(
    async (id: string, updates: Partial<Pick<Project, 'title' | 'description' | 'status' | 'priority'>>) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const project: Project = await res.json()
        storeUpdateProject(project)
        return project
      }
    },
    [storeUpdateProject]
  )

  const addNote = useCallback(
    async (projectId: string, content: string, noteType = 'thought') => {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, note_type: noteType }),
      })
      if (res.ok) {
        await fetchProjects()
        addXp(5)
      }
    },
    [fetchProjects, addXp]
  )

  const deleteProject = useCallback(
    async (id: string) => {
      removeProject(id)
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    },
    [removeProject]
  )

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const filteredProjects = store.filter === 'all'
    ? store.projects
    : store.projects.filter((p) => p.status === store.filter)

  return {
    ...store,
    filteredProjects,
    fetchProjects,
    createProject,
    updateProject,
    addNote,
    deleteProject,
  }
}
