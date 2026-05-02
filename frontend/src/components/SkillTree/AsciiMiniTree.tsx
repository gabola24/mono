import { motion } from 'framer-motion'
import type { SkillNode, SkillEdge } from '../../stores/skillTreeStore'

interface AsciiMiniTreeProps {
  topSkills: SkillNode[]
  edges: SkillEdge[]
  onClick: () => void
}

function buildAsciiGraph(skills: SkillNode[], edges: SkillEdge[]): string {
  if (skills.length === 0) {
    return '  ◇ no skills yet — feed me references'
  }

  const nodeIds = new Set(skills.map((s) => s.id))
  const relevantEdges = edges.filter(
    (e) => nodeIds.has(e.source_id) && nodeIds.has(e.target_id)
  )

  const nameById = new Map(skills.map((s) => [s.id, s.name]))
  const lines: string[] = []

  const connected = new Map<string, string[]>()
  for (const edge of relevantEdges) {
    const srcName = nameById.get(edge.source_id) || ''
    const tgtName = nameById.get(edge.target_id) || ''
    if (!connected.has(srcName)) connected.set(srcName, [])
    if (!connected.has(tgtName)) connected.set(tgtName, [])
    connected.get(srcName)!.push(tgtName)
    connected.get(tgtName)!.push(srcName)
  }

  const placed = new Set<string>()

  for (const skill of skills) {
    if (placed.has(skill.name)) continue
    placed.add(skill.name)

    const label = `◈ ${skill.name} [${skill.level}]`
    const neighbors = (connected.get(skill.name) || []).filter(
      (n) => !placed.has(n)
    )

    if (neighbors.length > 0) {
      const neighbor = neighbors[0]
      placed.add(neighbor)
      const nSkill = skills.find((s) => s.name === neighbor)
      const nLabel = `◈ ${neighbor} [${nSkill?.level ?? 1}]`
      lines.push(`  ${label} ──── ${nLabel}`)

      const subNeighbors = neighbors.slice(1)
      for (const sub of subNeighbors) {
        placed.add(sub)
        const subSkill = skills.find((s) => s.name === sub)
        lines.push(`         │`)
        lines.push(`  ◈ ${sub} [${subSkill?.level ?? 1}]`)
      }
    } else {
      lines.push(`  ${label}`)
    }
  }

  return lines.join('\n')
}

export default function AsciiMiniTree({
  topSkills,
  edges,
  onClick,
}: AsciiMiniTreeProps) {
  const ascii = buildAsciiGraph(topSkills.slice(0, 5), edges)

  return (
    <motion.div
      className="cursor-pointer px-4 py-3"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="relative rounded-lg border px-4 py-3 overflow-hidden"
        style={{
          background: 'var(--color-muse-surface)',
          borderColor: 'var(--color-muse-border)',
        }}
      >
        {/* Scanlines */}
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)',
          }}
        />

        <p
          className="text-[9px] font-mono tracking-[0.2em] uppercase mb-2"
          style={{ color: 'var(--color-muse-accent)' }}
        >
          mind map · {topSkills.length} node{topSkills.length !== 1 ? 's' : ''}
        </p>

        <pre
          className="font-mono text-[11px] leading-relaxed select-none whitespace-pre"
          style={{
            color: 'var(--color-muse-text)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {ascii}
        </pre>
      </div>
    </motion.div>
  )
}
