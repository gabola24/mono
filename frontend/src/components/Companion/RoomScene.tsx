/**
 * RoomScene — the ASCII art scene renderer.
 *
 * Composes a full scene each animation tick:
 *   background room (static, rebuilt only on skill changes)
 *   + animated pet frame (stage / mood driven)
 *   → single <pre> element
 *
 * This is the primary visual for the companion. The room populates with
 * objects as the user builds skills; the pet evolves from egg through
 * transcended stage.
 */

import { useMemo, useEffect, useState } from 'react'
import { useCompanionStore } from '../../stores/companionStore'
import { useSkillTreeStore } from '../../stores/skillTreeStore'
import { getFrames } from './asciiFrames'
import {
  buildRoomCanvas,
  compositeScene,
  resolveRoomObjects,
} from './asciiRoom'

// ─── Mood → ambient color ──────────────────────────────────────────────────────

const MOOD_COLOR: Record<string, string> = {
  idle:        'var(--color-muse-text)',
  thinking:    'var(--color-muse-text-dim)',
  speaking:    'var(--color-muse-text)',
  celebrating: 'var(--color-muse-accent)',
  eating:      'var(--color-muse-text)',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoomScene() {
  const { stage, mood } = useCompanionStore()
  const topSkills = useSkillTreeStore(s => s.topSkills)

  // Room objects change only when skills change — rebuild canvas then.
  const roomObjects = useMemo(() => resolveRoomObjects(topSkills.map(s => s.name)), [topSkills])
  const roomCanvas  = useMemo(() => buildRoomCanvas(roomObjects), [roomObjects])

  // Animation: cycle through the current mood's frames.
  const animation = useMemo(
    () => getFrames(stage, mood, topSkills.map(s => s.name)),
    [stage, mood, topSkills]
  )

  const [frameIdx, setFrameIdx] = useState(0)
  useEffect(() => {
    setFrameIdx(0)
    const timer = setInterval(
      () => setFrameIdx(prev => (prev + 1) % animation.frames.length),
      animation.interval
    )
    return () => clearInterval(timer)
  }, [animation])

  // Compose room + current pet frame into a single string grid.
  const petArt   = animation.frames[frameIdx].split('\n')
  const sceneLines = compositeScene(roomCanvas, petArt, stage)

  const color = MOOD_COLOR[mood] ?? MOOD_COLOR.idle

  return (
    <pre
      aria-label={`${stage} companion, ${mood} mood`}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        lineHeight: '1.22',
        color,
        margin: 0,
        padding: 0,
        userSelect: 'none',
        whiteSpace: 'pre',
        letterSpacing: '0',
        transition: 'color 0.6s ease',
        display: 'block',
      }}
    >
      {sceneLines.join('\n')}
    </pre>
  )
}
