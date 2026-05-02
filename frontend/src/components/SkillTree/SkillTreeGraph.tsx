import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import { select } from 'd3-selection'
import type { SkillNode, SkillEdge, SkillBadge } from '../../stores/skillTreeStore'

interface SkillTreeGraphProps {
  isOpen: boolean
  onClose: () => void
  nodes: SkillNode[]
  edges: SkillEdge[]
  badges: SkillBadge[]
}

interface SimNode extends SimulationNodeDatum {
  id: string
  name: string
  category: string | null
  level: number
  description: string | null
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  strength: number
  reason: string | null
}

export default function SkillTreeGraph({
  isOpen,
  onClose,
  nodes,
  edges,
  badges,
}: SkillTreeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null)

  const renderGraph = useCallback(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.id,
      name: n.name,
      category: n.category,
      level: n.level,
      description: n.description,
    }))

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]))
    const simLinks: SimLink[] = edges
      .filter((e) => nodeMap.has(e.source_id) && nodeMap.has(e.target_id))
      .map((e) => ({
        source: e.source_id,
        target: e.target_id,
        strength: e.strength,
        reason: e.reason,
      }))

    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(100)
      )
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide(40))

    const g = svg.append('g')

    const link = g
      .selectAll<SVGLineElement, SimLink>('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', '#e8a849')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', (d) => 1 + d.strength * 3)
      .attr('stroke-dasharray', '6,4')

    const node = g
      .selectAll<SVGGElement, SimNode>('g.node')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')

    node
      .append('circle')
      .attr('r', (d) => 8 + d.level * 4)
      .attr('fill', '#0a0800')
      .attr('stroke', '#e8a849')
      .attr('stroke-width', 1.5)
      .style('filter', 'drop-shadow(0 0 6px rgba(232,168,73,0.4))')

    node
      .append('text')
      .text((d) => d.name.replace(/_/g, ' '))
      .attr('dy', (d) => -(12 + d.level * 4))
      .attr('text-anchor', 'middle')
      .attr('fill', '#e8a849')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .attr('font-size', '11px')
      .style('text-shadow', '0 0 6px rgba(232,168,73,0.5)')

    node
      .append('text')
      .text((d) => `lvl ${d.level}`)
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e8a849')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .attr('font-size', '9px')
      .attr('opacity', 0.7)

    node.on('click', (_event, d) => {
      setSelectedNode(d)
    })

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0)

      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    return () => simulation.stop()
  }, [nodes, edges])

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(renderGraph, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, renderGraph])

  const nodeBadges = selectedNode
    ? badges.filter((b) => b.skill_node_id === selectedNode.id)
    : []

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-[90vw] h-[80vh] max-w-5xl bg-[#0a0800] rounded-xl border border-amber-900/30 overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Scanlines */}
            <div
              className="pointer-events-none absolute inset-0 z-20 opacity-[0.04]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
              }}
            />

            {/* Vignette */}
            <div
              className="pointer-events-none absolute inset-0 z-20"
              style={{
                background:
                  'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
              }}
            />

            {/* Header */}
            <div className="relative z-30 flex items-center justify-between px-5 py-3 border-b border-amber-900/20">
              <h2
                className="font-mono text-sm tracking-wider"
                style={{
                  color: 'var(--color-crt-amber)',
                  textShadow: '0 0 8px var(--color-crt-glow)',
                }}
              >
                SKILL TREE · {nodes.length} nodes · {badges.length} badges
              </h2>
              <button
                onClick={onClose}
                className="font-mono text-xs px-3 py-1 rounded border border-amber-900/30 transition-colors hover:border-amber-700/50"
                style={{ color: 'var(--color-crt-amber)' }}
              >
                [close]
              </button>
            </div>

            {/* Graph area */}
            <div className="relative z-10 flex h-[calc(100%-48px)]">
              <svg
                ref={svgRef}
                className="flex-1"
                style={{ background: 'transparent' }}
              />

              {/* Detail panel */}
              <AnimatePresence>
                {selectedNode && (
                  <motion.div
                    className="w-64 border-l border-amber-900/20 p-4 overflow-y-auto"
                    initial={{ x: 64, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 64, opacity: 0 }}
                  >
                    <h3
                      className="font-mono text-xs tracking-wider mb-3"
                      style={{
                        color: 'var(--color-crt-amber)',
                        textShadow: '0 0 4px var(--color-crt-glow)',
                      }}
                    >
                      {selectedNode.name.replace(/_/g, ' ')}
                    </h3>

                    <div className="space-y-2 text-[11px] font-mono" style={{ color: 'var(--color-muse-text-dim)' }}>
                      {selectedNode.category && (
                        <p>category: {selectedNode.category}</p>
                      )}
                      <p>level: {selectedNode.level}</p>
                      {selectedNode.description && (
                        <p className="mt-2" style={{ color: 'var(--color-muse-text)' }}>
                          {selectedNode.description}
                        </p>
                      )}
                    </div>

                    {nodeBadges.length > 0 && (
                      <div className="mt-4">
                        <p
                          className="font-mono text-[10px] tracking-wider uppercase mb-2"
                          style={{ color: 'var(--color-muse-text-dim)' }}
                        >
                          badges
                        </p>
                        {nodeBadges.map((b) => (
                          <div
                            key={b.id}
                            className="text-[11px] font-mono mb-1 px-2 py-1 rounded border border-amber-900/20"
                            style={{ color: 'var(--color-crt-amber)' }}
                          >
                            ✦ {b.name}
                            <span
                              className="block text-[10px] mt-0.5"
                              style={{ color: 'var(--color-muse-text-dim)' }}
                            >
                              {b.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedNode(null)}
                      className="mt-4 font-mono text-[10px] underline"
                      style={{ color: 'var(--color-muse-text-dim)' }}
                    >
                      close panel
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
