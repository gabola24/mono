import { create } from 'zustand'

export interface Reference {
  id: string
  type: 'text' | 'image'
  title: string
  content: string
  file_path?: string | null
  created_at: string
}

export interface ReferenceStats {
  total_count: number
  text_count: number
  image_count: number
  trust_level: number
}

interface ReferenceState {
  references: Reference[]
  stats: ReferenceStats
  isUploading: boolean
  setReferences: (refs: Reference[]) => void
  addReference: (ref: Reference) => void
  removeReference: (id: string) => void
  setStats: (stats: ReferenceStats) => void
  setUploading: (val: boolean) => void
}

export const useReferenceStore = create<ReferenceState>((set) => ({
  references: [],
  stats: { total_count: 0, text_count: 0, image_count: 0, trust_level: 0 },
  isUploading: false,
  setReferences: (refs) => set({ references: refs }),
  addReference: (ref) =>
    set((s) => ({ references: [ref, ...s.references] })),
  removeReference: (id) =>
    set((s) => ({ references: s.references.filter((r) => r.id !== id) })),
  setStats: (stats) => set({ stats }),
  setUploading: (val) => set({ isUploading: val }),
}))
