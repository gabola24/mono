import { useState, useCallback, useEffect } from 'react'
import { apiFetch } from '../lib/api'

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
    reason: string | null
    kind: string | null
}

export function useMindGraph() {
    const [nodes, setNodes] = useState<MindNode[]>([])
    const [edges, setEdges] = useState<MindEdge[]>([])

    const fetchGraph = useCallback(async () => {
        try {
            const res = await apiFetch('/api/graph')
            if (res.ok) {
                const data = await res.json() as { nodes: MindNode[]; edges: MindEdge[] }
                if (data.nodes.length === 0) {
                    await apiFetch('/api/graph/seed', { method: 'POST' })
                    const retryRes = await apiFetch('/api/graph')
                    if (retryRes.ok) {
                        const retryData = await retryRes.json() as { nodes: MindNode[]; edges: MindEdge[] }
                        setNodes(retryData.nodes)
                        setEdges(retryData.edges)
                    }
                } else {
                    setNodes(data.nodes)
                    setEdges(data.edges)
                }
            }
        } catch (e) {
            console.error('Failed to fetch Mind Graph', e)
        }
    }, [])

    useEffect(() => {
        fetchGraph()
    }, [fetchGraph])

    return {
        nodes,
        edges,
        fetchGraph,
    }
}
