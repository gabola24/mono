import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'

interface StreakInfo {
  current_streak: number
  longest_streak: number
  total_days: number
}

export default function StreakCounter() {
  const [streak, setStreak] = useState<StreakInfo | null>(null)

  useEffect(() => {
    apiFetch('/api/activity/checkin', { method: 'POST' })
      .then((r) => r.json())
      .then(setStreak)
      .catch(() => {})
  }, [])

  if (!streak || streak.current_streak === 0) return null

  return (
    <div
      className="flex items-center gap-1.5 font-mono text-[11px]"
      style={{ color: 'var(--color-crt-amber)', opacity: 0.7 }}
      title={`${streak.total_days} total days · best: ${streak.longest_streak}`}
    >
      <span className="text-xs">&#x2731;</span>
      <span>{streak.current_streak}d</span>
    </div>
  )
}
