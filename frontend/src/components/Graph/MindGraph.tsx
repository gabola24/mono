import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    forceCollide,
    forceX,
    forceY,
    type SimulationNodeDatum,
    type SimulationLinkDatum,
} from 'd3-force'
import { select } from 'd3-selection'

export interface MindNode {
    id: string
    text: string
    category: string | null
    color: string | null
    source: string
    created_at: string
}

export interface MindEdge {
    id: string
    source_id: string
    target_id: string
    strength: number
}

interface MindGraphProps {
    isOpen: boolean
    onClose: () => void
    nodes: MindNode[]
    edges: MindEdge[]
}

interface SimNode extends SimulationNodeDatum, MindNode { }

interface SimLink extends SimulationLinkDatum<SimNode> {
    id: string
    strength: number
}

const POSITION_KEY = 'zukuri-mind-positions'

function loadPositions(): Map<string, { x: number; y: number }> {
    try {
        const raw = localStorage.getItem(POSITION_KEY)
        if (!raw) return new Map()
        return new Map(JSON.parse(raw) as [string, { x: number; y: number }][])
    } catch {
        return new Map()
    }
}

function savePositions(positions: Map<string, { x: number; y: number }>) {
    try {
        localStorage.setItem(POSITION_KEY, JSON.stringify([...positions.entries()]))
    } catch { }
}

export default function MindGraph({
    isOpen,
    onClose,
    nodes,
    edges,
}: MindGraphProps) {
    const svgRef = useRef<SVGSVGElement>(null)
    const [selectedNode, setSelectedNode] = useState<SimNode | null>(null)

    const renderGraph = useCallback(() => {
        if (!svgRef.current || nodes.length === 0) return

        const svg = select(svgRef.current)
        svg.selectAll('*').remove()

        const width = svgRef.current.clientWidth || 800
        const height = svgRef.current.clientHeight || 600
        const padding = 32

        const savedPos = loadPositions()

        const simNodes: SimNode[] = nodes.map(n => ({
            ...n,
            x: savedPos.get(n.id)?.x ?? (Math.random() * (width - padding * 2) + padding),
            y: savedPos.get(n.id)?.y ?? (Math.random() * (height - padding * 2) + padding),
        }))

        const nodeMap = new Map(simNodes.map(n => [n.id, n]))

        const simLinks: SimLink[] = edges
            .filter(e => nodeMap.has(e.source_id) && nodeMap.has(e.target_id))
            .map(e => ({
                id: e.id,
                source: e.source_id,
                target: e.target_id,
                strength: e.strength,
            }))

        const simulation = forceSimulation<SimNode>(simNodes)
            .force(
                'link',
                forceLink<SimNode, SimLink>(simLinks)
                    .id(d => d.id)
                    .distance(100)
                    .strength(0.6)
            )
            .force('charge', forceManyBody().strength(-180))
            .force('center', forceCenter(width / 2, height / 2).strength(0.08))
            .force('collide', forceCollide(40))
            .force('x', forceX(width / 2).strength(0.04))
            .force('y', forceY(height / 2).strength(0.04))

        // If nodes have saved positions, start with low alpha so they barely move
        if (simNodes.every(n => savedPos.has(n.id))) {
            simulation.alpha(0.1).alphaDecay(0.05)
        }

        const g = svg.append('g')

        const link = g
            .selectAll<SVGLineElement, SimLink>('line')
            .data(simLinks)
            .enter()
            .append('line')
            .attr('stroke', 'var(--color-muse-border)')
            .attr('stroke-opacity', 0.5)
            .attr('stroke-width', d => 1 + d.strength * 2)
            .attr('stroke-dasharray', '4,4')

        const node = g
            .selectAll<SVGGElement, SimNode>('g.node')
            .data(simNodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .style('cursor', 'pointer')

        node
            .append('circle')
            .attr('r', 16)
            .attr('fill', 'var(--color-muse-surface)')
            .attr('stroke', d => d.color || 'var(--color-pixel-pink)')
            .attr('stroke-width', 2)
            .style('filter', d => `drop-shadow(0 0 6px ${d.color || 'var(--color-pixel-pink)'}80)`)

        node
            .append('text')
            .text(d => d.text ? d.text.charAt(0).toUpperCase() : '?')
            .attr('dy', 4)
            .attr('text-anchor', 'middle')
            .attr('fill', d => d.color || 'var(--color-pixel-pink)')
            .style('font-family', 'var(--font-pixel)')
            .style('font-size', '8px')

        node
            .append('text')
            .text(d => d.text ? (d.text.length > 15 ? d.text.substring(0, 15) + '...' : d.text) : 'Node')
            .attr('dy', 30)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--color-muse-text-dim)')
            .style('font-family', 'var(--font-pixel)')
            .style('font-size', '6px')
            .style('opacity', 0.8)

        node.on('click', (_event, d) => {
            setSelectedNode(d)
        })

        simulation.on('tick', () => {
            // Clamp all nodes within visible bounds
            simNodes.forEach(n => {
                n.x = Math.max(padding, Math.min(width - padding, n.x ?? width / 2))
                n.y = Math.max(padding, Math.min(height - padding, n.y ?? height / 2))
            })

            link
                .attr('x1', d => (d.source as SimNode).x ?? 0)
                .attr('y1', d => (d.source as SimNode).y ?? 0)
                .attr('x2', d => (d.target as SimNode).x ?? 0)
                .attr('y2', d => (d.target as SimNode).y ?? 0)

            node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
        })

        simulation.on('end', () => {
            const positions = new Map(
                simNodes
                    .filter(n => n.x !== undefined && n.y !== undefined)
                    .map(n => [n.id, { x: n.x!, y: n.y! }])
            )
            savePositions(positions)
        })

        return () => simulation.stop()
    }, [nodes, edges])

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(renderGraph, 100)
            return () => clearTimeout(timer)
        }
    }, [isOpen, renderGraph])

    // Compute graph stats
    const categoryCounts: Record<string, number> = {}
    nodes.forEach(n => {
        if (n.category) {
            categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1
        }
    })
    const topClusters = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0])

    // Compute connected nodes for the inspector
    const connectedInfo = selectedNode
        ? edges
            .filter(e => e.source_id === selectedNode.id || e.target_id === selectedNode.id)
            .map(e => {
                const peerId = e.source_id === selectedNode.id ? e.target_id : e.source_id
                const peer = nodes.find(n => n.id === peerId)
                return peer ? { node: peer, strength: e.strength } : null
            })
            .filter(Boolean) as { node: MindNode; strength: number }[]
        : []

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="pixel-panel relative w-[90vw] h-[80vh] max-w-5xl flex flex-col overflow-hidden"
                        initial={{ scale: 0.95, y: 10, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 10, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-muse-border bg-[var(--color-muse-surface-light)] z-10">
                            <h2
                                className="pixel-text text-[12px] tracking-wider pixel-glow-gold"
                                style={{ color: 'var(--color-muse-accent)' }}
                            >
                                MIND GRAPH · {nodes.length} nodes
                                {topClusters.length > 0 && (
                                    <span className="opacity-70 text-[9px] ml-4 font-mono text-muse-text tracking-normal">
                                        clusters: {topClusters.join(', ')}
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={onClose}
                                className="pixel-btn-ghost text-[10px]"
                            >
                                [CLOSE]
                            </button>
                        </div>

                        {/* Graph area */}
                        <div className="relative flex-1 flex h-full overflow-hidden">
                            <div
                                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect x='0' y='0' width='2' height='2' fill='%23000'/%3E%3C/svg%3E")`,
                                }}
                            />
                            <svg
                                ref={svgRef}
                                className="flex-1 w-full h-full"
                                style={{ background: 'var(--color-muse-bg)' }}
                            />

                            {/* Node inspector panel */}
                            <AnimatePresence>
                                {selectedNode && (
                                    <motion.div
                                        className="absolute right-0 top-0 bottom-0 w-72 border-l border-muse-border bg-[var(--color-muse-surface)] overflow-y-auto shadow-xl"
                                        initial={{ x: 100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: 100, opacity: 0 }}
                                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    >
                                        <div className="p-5 space-y-5">
                                            <div className="flex items-start justify-between">
                                                <h3
                                                    className="pixel-text text-[10px] tracking-wider"
                                                    style={{ color: selectedNode.color || 'var(--color-pixel-pink)' }}
                                                >
                                                    node inspector
                                                </h3>
                                                <button
                                                    onClick={() => setSelectedNode(null)}
                                                    className="text-[10px] text-muse-text-dim hover:text-muse-accent"
                                                    style={{ fontFamily: 'var(--font-pixel)' }}
                                                >
                                                    [X]
                                                </button>
                                            </div>

                                            {/* Node text */}
                                            <div>
                                                <p className="text-[6px] uppercase tracking-widest text-muse-text-dim mb-1" style={{ fontFamily: 'var(--font-pixel)' }}>
                                                    concept
                                                </p>
                                                <p className="text-muse-text text-xs leading-relaxed" style={{ fontFamily: 'var(--font-mono)' }}>
                                                    {selectedNode.text}
                                                </p>
                                            </div>

                                            {/* Category + source row */}
                                            <div className="flex gap-3">
                                                {selectedNode.category && (
                                                    <div>
                                                        <p className="text-[6px] uppercase tracking-widest text-muse-text-dim mb-1" style={{ fontFamily: 'var(--font-pixel)' }}>
                                                            category
                                                        </p>
                                                        <span
                                                            className="text-[8px] px-2 py-0.5 border rounded"
                                                            style={{
                                                                fontFamily: 'var(--font-pixel)',
                                                                borderColor: selectedNode.color || 'var(--color-pixel-pink)',
                                                                color: selectedNode.color || 'var(--color-pixel-pink)',
                                                                background: `${selectedNode.color || '#F4DBD6'}18`,
                                                            }}
                                                        >
                                                            {selectedNode.category}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-[6px] uppercase tracking-widest text-muse-text-dim mb-1" style={{ fontFamily: 'var(--font-pixel)' }}>
                                                        origin
                                                    </p>
                                                    <span
                                                        className="text-[8px] px-2 py-0.5 border rounded"
                                                        style={{
                                                            fontFamily: 'var(--font-pixel)',
                                                            borderColor: 'var(--color-muse-border)',
                                                            color: 'var(--color-muse-accent)',
                                                        }}
                                                    >
                                                        {selectedNode.source}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Connections */}
                                            <div>
                                                <p className="text-[6px] uppercase tracking-widest text-muse-text-dim mb-2" style={{ fontFamily: 'var(--font-pixel)' }}>
                                                    connections [{connectedInfo.length}]
                                                </p>

                                                {connectedInfo.length === 0 ? (
                                                    <p className="text-[8px] text-muse-text-dim italic" style={{ fontFamily: 'var(--font-mono)' }}>
                                                        isolated node — no links yet
                                                    </p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {connectedInfo.map(({ node: peer, strength }) => (
                                                            <div
                                                                key={peer.id}
                                                                className="p-2 rounded border cursor-pointer hover:border-muse-accent/60 transition-colors"
                                                                style={{
                                                                    borderColor: 'var(--color-muse-border)',
                                                                    background: 'var(--color-muse-bg)',
                                                                }}
                                                                onClick={() => {
                                                                    const simNode = { ...peer } as SimNode
                                                                    setSelectedNode(simNode)
                                                                }}
                                                            >
                                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                                    <span
                                                                        className="text-[8px] text-muse-text truncate"
                                                                        style={{ fontFamily: 'var(--font-mono)' }}
                                                                    >
                                                                        {peer.text.length > 22 ? peer.text.substring(0, 22) + '…' : peer.text}
                                                                    </span>
                                                                    <span
                                                                        className="text-[7px] shrink-0"
                                                                        style={{
                                                                            fontFamily: 'var(--font-pixel)',
                                                                            color: 'var(--color-muse-text-dim)',
                                                                        }}
                                                                    >
                                                                        {Math.round(strength * 100)}%
                                                                    </span>
                                                                </div>
                                                                {/* Strength bar */}
                                                                <div
                                                                    className="h-[3px] rounded-full"
                                                                    style={{ background: 'var(--color-muse-border)' }}
                                                                >
                                                                    <div
                                                                        className="h-full rounded-full"
                                                                        style={{
                                                                            width: `${strength * 100}%`,
                                                                            background: peer.color || 'var(--color-pixel-pink)',
                                                                        }}
                                                                    />
                                                                </div>
                                                                {peer.category && (
                                                                    <p
                                                                        className="text-[7px] mt-1 opacity-60"
                                                                        style={{
                                                                            fontFamily: 'var(--font-pixel)',
                                                                            color: peer.color || 'var(--color-muse-text-dim)',
                                                                        }}
                                                                    >
                                                                        {peer.category}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
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
