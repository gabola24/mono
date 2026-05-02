import { create } from 'zustand'

export interface ProjectNote {
  id: string
  project_id: string
  content: string
  note_type: 'thought' | 'finding' | 'blocker' | 'decision'
  created_at: string
}

export interface Project {
  id: string
  title: string
  description: string
  status: 'idea' | 'active' | 'paused' | 'blocked' | 'completed' | 'archived'
  priority: number
  plan_ids: string[]
  reference_ids: string[]
  notes: ProjectNote[]
  created_at: string
  updated_at: string
}

export type GarageFilter = 'all' | 'idea' | 'active' | 'blocked'

interface GarageState {
  projects: Project[]
  filter: GarageFilter
  selectedProjectId: string | null
  isCreating: boolean
  setProjects: (p: Project[]) => void
  addProject: (p: Project) => void
  updateProject: (p: Project) => void
  removeProject: (id: string) => void
  setFilter: (f: GarageFilter) => void
  selectProject: (id: string | null) => void
  setCreating: (v: boolean) => void
}

export const useGarageStore = create<GarageState>((set) => ({
  projects: [],
  filter: 'all',
  selectedProjectId: null,
  isCreating: false,
  setProjects: (projects) => set({ projects }),
  addProject: (p) => set((s) => ({ projects: [p, ...s.projects] })),
  updateProject: (p) =>
    set((s) => ({
      projects: s.projects.map((proj) => (proj.id === p.id ? p : proj)),
    })),
  removeProject: (id) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      selectedProjectId: s.selectedProjectId === id ? null : s.selectedProjectId,
    })),
  setFilter: (filter) => set({ filter }),
  selectProject: (selectedProjectId) => set({ selectedProjectId }),
  setCreating: (isCreating) => set({ isCreating }),
}))
