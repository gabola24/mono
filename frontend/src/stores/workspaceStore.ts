import { create } from 'zustand'

export interface PlanStep {
  order: number
  title: string
  description: string
  done: boolean
}

export interface Plan {
  id: string
  title: string
  summary: string
  steps: PlanStep[]
  source_message: string | null
  created_at: string
}

export interface Habit {
  id: string
  name: string
  frequency: string
  active: boolean
  created_at: string
  streak: number
  completed_today: boolean
}

export interface CreativeDNA {
  themes: string[]
  color_tendencies: string[]
  influences: string[]
  patterns: string[]
  creative_energy: string
  total_references: number
  total_conversations: number
}

type WorkspaceTab = 'plans' | 'habits' | 'dna'

interface WorkspaceState {
  plans: Plan[]
  habits: Habit[]
  dna: CreativeDNA | null
  activeTab: WorkspaceTab
  isGenerating: boolean
  isLoadingDNA: boolean
  setPlans: (p: Plan[]) => void
  addPlan: (p: Plan) => void
  updatePlanStep: (planId: string, stepOrder: number, done: boolean) => void
  removePlan: (id: string) => void
  setHabits: (h: Habit[]) => void
  toggleHabit: (id: string) => void
  removeHabit: (id: string) => void
  setDNA: (d: CreativeDNA) => void
  setTab: (t: WorkspaceTab) => void
  setGenerating: (v: boolean) => void
  setLoadingDNA: (v: boolean) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  plans: [],
  habits: [],
  dna: null,
  activeTab: 'plans',
  isGenerating: false,
  isLoadingDNA: false,
  setPlans: (plans) => set({ plans }),
  addPlan: (p) => set((s) => ({ plans: [p, ...s.plans] })),
  updatePlanStep: (planId, stepOrder, done) =>
    set((s) => ({
      plans: s.plans.map((p) =>
        p.id === planId
          ? { ...p, steps: p.steps.map((st) => (st.order === stepOrder ? { ...st, done } : st)) }
          : p
      ),
    })),
  removePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),
  setHabits: (habits) => set({ habits }),
  toggleHabit: (id) =>
    set((s) => ({
      habits: s.habits.map((h) =>
        h.id === id ? { ...h, completed_today: !h.completed_today } : h
      ),
    })),
  removeHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),
  setDNA: (dna) => set({ dna }),
  setTab: (activeTab) => set({ activeTab }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setLoadingDNA: (isLoadingDNA) => set({ isLoadingDNA }),
}))
