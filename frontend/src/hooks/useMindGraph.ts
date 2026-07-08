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

interface GraphData {
    nodes: MindNode[]
    edges: MindEdge[]
    truncated?: boolean
    total_count?: number
}

export function useMindGraph() {
    const [nodes, setNodes] = useState<MindNode[]>([])
    const [edges, setEdges] = useState<MindEdge[]>([])
    const [truncated, setTruncated] = useState(false)
    const [totalCount, setTotalCount] = useState(0)

    const fetchGraph = useCallback(async () => {
        try {
            const res = await apiFetch('/api/graph')
            if (res.ok) {
                const data = await res.json() as GraphData
                if (data.nodes.length === 0 && !data.truncated) {
                    await apiFetch('/api/graph/seed', { method: 'POST' })
                    const retryRes = await apiFetch('/api/graph')
                    if (retryRes.ok) {
                        const retryData = await retryRes.json() as GraphData
                        setNodes(retryData.nodes)
                        setEdges(retryData.edges)
                        setTruncated(retryData.truncated ?? false)
                        setTotalCount(retryData.total_count ?? 0)
                    }
                } else {
                    setNodes(data.nodes)
                    setEdges(data.edges)
                    setTruncated(data.truncated ?? false)
                    setTotalCount(data.total_count ?? 0)
                }
            }
        } catch (e) {
            console.error('Failed to fetch Mind Graph', e)
        }
    }, [])

    useEffect(() => {
        fetchGraph()
    }, [fetchGraph])

    return { nodes, edges, truncated, totalCount, fetchGraph }
}
