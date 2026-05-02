import { useCallback, useEffect } from 'react'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useCompanionStore } from '../stores/companionStore'

export function useWorkspace() {
  const store = useWorkspaceStore()
  const { addXp, setMood } = useCompanionStore()

  const fetchPlans = useCallback(async () => {
    const res = await fetch('/api/plans')
    if (res.ok) store.setPlans(await res.json())
  }, [store.setPlans])

  const fetchHabits = useCallback(async () => {
    const res = await fetch('/api/habits')
    if (res.ok) store.setHabits(await res.json())
  }, [store.setHabits])

  const fetchDNA = useCallback(async () => {
    store.setLoadingDNA(true)
    setMood('thinking')
    try {
      const res = await fetch('/api/profile/dna')
      if (res.ok) {
        store.setDNA(await res.json())
        addXp(20)
        setMood('celebrating')
        setTimeout(() => setMood('idle'), 1500)
      } else {
        setMood('idle')
      }
    } catch {
      setMood('idle')
    } finally {
      store.setLoadingDNA(false)
    }
  }, [store.setDNA, store.setLoadingDNA, addXp, setMood])

  const generatePlan = useCallback(
    async (topic: string) => {
      store.setGenerating(true)
      setMood('thinking')
      try {
        const res = await fetch('/api/plans/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic }),
        })
        if (res.ok) {
          const plan = await res.json()
          store.addPlan(plan)
          addXp(25)
          setMood('celebrating')
          setTimeout(() => setMood('idle'), 1500)
          return plan
        }
      } finally {
        store.setGenerating(false)
      }
    },
    [store.setGenerating, store.addPlan, addXp, setMood]
  )

  const toggleStep = useCallback(
    async (planId: string, stepOrder: number, done: boolean) => {
      store.updatePlanStep(planId, stepOrder, done)
      await fetch(`/api/plans/${planId}/step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_order: stepOrder, done }),
      })
      if (done) addXp(5)
    },
    [store.updatePlanStep, addXp]
  )

  const deletePlan = useCallback(
    async (id: string) => {
      store.removePlan(id)
      await fetch(`/api/plans/${id}`, { method: 'DELETE' })
    },
    [store.removePlan]
  )

  const createHabit = useCallback(
    async (name: string, frequency: string = 'daily') => {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, frequency }),
      })
      if (res.ok) {
        await fetchHabits()
        addXp(10)
      }
    },
    [fetchHabits, addXp]
  )

  const checkHabit = useCallback(
    async (id: string) => {
      store.toggleHabit(id)
      const res = await fetch(`/api/habits/${id}/check`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.checked) {
          addXp(10)
          setMood('celebrating')
          setTimeout(() => setMood('idle'), 1200)
        }
      }
    },
    [store.toggleHabit, addXp, setMood]
  )

  const deleteHabit = useCallback(
    async (id: string) => {
      store.removeHabit(id)
      await fetch(`/api/habits/${id}`, { method: 'DELETE' })
    },
    [store.removeHabit]
  )

  useEffect(() => {
    fetchPlans()
    fetchHabits()
  }, [fetchPlans, fetchHabits])

  return {
    ...store,
    generatePlan,
    toggleStep,
    deletePlan,
    createHabit,
    checkHabit,
    deleteHabit,
    fetchDNA,
  }
}
