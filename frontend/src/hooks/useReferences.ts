import { useCallback, useEffect } from 'react'
import { useReferenceStore } from '../stores/referenceStore'
import { useCompanionStore } from '../stores/companionStore'

export function useReferences() {
  const {
    references,
    stats,
    isUploading,
    setReferences,
    addReference,
    removeReference,
    setStats,
    setUploading,
  } = useReferenceStore()

  const { setMood, addXp, loseXp } = useCompanionStore()

  const fetchReferences = useCallback(async () => {
    const [refsRes, statsRes] = await Promise.all([
      fetch('/api/references'),
      fetch('/api/references/stats'),
    ])
    if (refsRes.ok) setReferences(await refsRes.json())
    if (statsRes.ok) setStats(await statsRes.json())
  }, [setReferences, setStats])

  const uploadText = useCallback(
    async (content: string, title?: string) => {
      setUploading(true)
      setMood('eating')
      try {
        const res = await fetch('/api/references/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, title: title || '' }),
        })
        if (res.ok) {
          const ref = await res.json()
          addReference(ref)
          addXp(15)
          setMood('celebrating')
          setTimeout(() => setMood('idle'), 1500)
          const statsRes = await fetch('/api/references/stats')
          if (statsRes.ok) setStats(await statsRes.json())
        }
      } finally {
        setUploading(false)
      }
    },
    [setUploading, setMood, addReference, addXp, setStats]
  )

  const uploadImage = useCallback(
    async (file: File, title?: string) => {
      setUploading(true)
      setMood('eating')
      try {
        const form = new FormData()
        form.append('file', file)
        if (title) form.append('title', title)
        const res = await fetch('/api/references/image', {
          method: 'POST',
          body: form,
        })
        if (res.ok) {
          const ref = await res.json()
          addReference(ref)
          addXp(20)
          setMood('celebrating')
          setTimeout(() => setMood('idle'), 1500)
          const statsRes = await fetch('/api/references/stats')
          if (statsRes.ok) setStats(await statsRes.json())
        }
      } finally {
        setUploading(false)
      }
    },
    [setUploading, setMood, addReference, addXp, setStats]
  )

  const deleteReference = useCallback(
    async (id: string) => {
      await fetch(`/api/references/${id}`, { method: 'DELETE' })
      removeReference(id)
      loseXp(5)
      const statsRes = await fetch('/api/references/stats')
      if (statsRes.ok) setStats(await statsRes.json())
    },
    [removeReference, setStats, loseXp]
  )

  useEffect(() => {
    fetchReferences()
  }, [fetchReferences])

  return { references, stats, isUploading, uploadText, uploadImage, deleteReference }
}
