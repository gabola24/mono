import { create } from 'zustand'

export interface SkillNode {
  id: string
  name: string
  category: string | null
  description: string | null
  xp: number
  level: number
  created_at: string
}

export interface SkillEdge {
  id: string
  source_id: string
  target_id: string
  strength: number
  reason: string | null
}

export interface SkillBadge {
  id: string
  skill_node_id: string
  name: string
  description: string
  earned_at: string
}

interface SkillTreeState {
  nodes: SkillNode[]
  edges: SkillEdge[]
  badges: SkillBadge[]
  topSkills: SkillNode[]
  totalNodes: number
  totalBadges: number
  pendingBadge: SkillBadge | null
  setTree: (nodes: SkillNode[], edges: SkillEdge[], badges: SkillBadge[]) => void
  setSummary: (topSkills: SkillNode[], totalNodes: number, totalBadges: number) => void
  showBadge: (badge: SkillBadge) => void
  dismissBadge: () => void
}

export const useSkillTreeStore = create<SkillTreeState>((set) => ({
  nodes: [],
  edges: [],
  badges: [],
  topSkills: [],
  totalNodes: 0,
  totalBadges: 0,
  pendingBadge: null,
  setTree: (nodes, edges, badges) => set({ nodes, edges, badges }),
  setSummary: (topSkills, totalNodes, totalBadges) =>
    set({ topSkills, totalNodes, totalBadges }),
  showBadge: (badge) => set({ pendingBadge: badge }),
  dismissBadge: () => set({ pendingBadge: null }),
}))
