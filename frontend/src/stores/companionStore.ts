import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CompanionMood = 'idle' | 'thinking' | 'speaking' | 'celebrating' | 'eating'
export type CompanionStage = 'egg' | 'hatchling' | 'adolescent' | 'evolved' | 'transcended'

interface CompanionState {
  mood: CompanionMood
  stage: CompanionStage
  xp: number
  level: number
  lastActiveDate: string
  setMood: (mood: CompanionMood) => void
  addXp: (amount: number) => void
  loseXp: (amount: number) => void
  checkDailyDecay: () => void
}

function stageFromLevel(level: number): CompanionStage {
  if (level < 2) return 'egg'
  if (level < 5) return 'hatchling'
  if (level < 10) return 'adolescent'
  if (level < 20) return 'evolved'
  return 'transcended'
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

const XP_PER_LEVEL = 100
const DECAY_PER_MISSED_DAY = 10
const MAX_DECAY = 50

export const useCompanionStore = create<CompanionState>()(
  persist(
    (set) => ({
      mood: 'idle',
      stage: 'egg',
      xp: 0,
      level: 1,
      lastActiveDate: '',
      setMood: (mood) => set({ mood }),
      addXp: (amount) =>
        set((state) => {
          const newXp = state.xp + amount
          const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1
          return {
            xp: newXp,
            level: newLevel,
            stage: stageFromLevel(newLevel),
            lastActiveDate: today(),
          }
        }),
      loseXp: (amount) =>
        set((state) => {
          const newXp = Math.max(0, state.xp - amount)
          const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1
          return {
            xp: newXp,
            level: newLevel,
            stage: stageFromLevel(newLevel),
          }
        }),
      checkDailyDecay: () =>
        set((state) => {
          const todayStr = today()
          if (!state.lastActiveDate || state.lastActiveDate === todayStr) {
            return { lastActiveDate: todayStr }
          }
          const last = new Date(state.lastActiveDate)
          const now = new Date(todayStr)
          const diffDays = Math.floor((now.getTime() - last.getTime()) / 86_400_000)
          if (diffDays <= 0) return { lastActiveDate: todayStr }

          const totalDecay = Math.min(diffDays * DECAY_PER_MISSED_DAY, MAX_DECAY)
          const newXp = Math.max(0, state.xp - totalDecay)
          const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1
          return {
            xp: newXp,
            level: newLevel,
            stage: stageFromLevel(newLevel),
            lastActiveDate: todayStr,
          }
        }),
    }),
    {
      name: 'companion-storage',
      partialize: (state) => ({
        xp: state.xp,
        level: state.level,
        stage: state.stage,
        lastActiveDate: state.lastActiveDate,
      }),
    }
  )
)
