import { useCallback, useEffect } from 'react'
import { useSkillTreeStore } from '../stores/skillTreeStore'
import { apiFetch } from '../lib/api'

export function useSkillTree() {
  const {
    nodes, edges, badges, topSkills,
    totalNodes, totalBadges, pendingBadge,
    setTree, setSummary, showBadge, dismissBadge,
  } = useSkillTreeStore()

  const fetchTree = useCallback(async () => {
    const res = await apiFetch('/api/skills/tree')
    if (res.ok) {
      const data = await res.json()
      setTree(data.nodes, data.edges, data.badges)
    }
  }, [setTree])

  const fetchSummary = useCallback(async () => {
    const res = await apiFetch('/api/skills/summary')
    if (res.ok) {
      const data = await res.json()
      setSummary(data.top_skills, data.total_nodes, data.total_badges)
    }
  }, [setSummary])

  const reanalyze = useCallback(async () => {
    const res = await apiFetch('/api/skills/reanalyze', { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      if (data.new_badges?.length) {
        showBadge(data.new_badges[0])
      }
      await fetchTree()
      await fetchSummary()
    }
  }, [fetchTree, fetchSummary, showBadge])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return {
    nodes, edges, badges, topSkills,
    totalNodes, totalBadges, pendingBadge,
    fetchTree, fetchSummary, reanalyze, dismissBadge,
  }
}
