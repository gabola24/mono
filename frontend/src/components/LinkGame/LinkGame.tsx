import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRandomPairs, type ConceptPair } from '../../game/concepts'
import { useCompanionStore } from '../../stores/companionStore'

interface LinkGameProps {
    isOpen: boolean
    onClose: () => void
    onGraphUpdate: () => void
}

export default function LinkGame({ isOpen, onClose, onGraphUpdate }: LinkGameProps) {
    const [pairs, setPairs] = useState<ConceptPair[]>([])
    const [currentRound, setCurrentRound] = useState(0)
    const [connectionInput, setConnectionInput] = useState('')
    const [timeLeft, setTimeLeft] = useState(15)
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'results'>('intro')
    const [history, setHistory] = useState<{ pair: ConceptPair, connection: string }[]>([])

    const { setMood } = useCompanionStore()
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen && gameState === 'intro') {
            setPairs(getRandomPairs(5))
            setHistory([])
            setCurrentRound(0)
        }
    }, [isOpen, gameState])

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
        } else if (gameState === 'playing' && timeLeft === 0) {
            handleTimeUp()
        }
        return () => clearTimeout(timer)
    }, [gameState, timeLeft])

    useEffect(() => {
        if (gameState === 'playing') {
            inputRef.current?.focus()
        }
    }, [gameState, currentRound])

    const handleStart = () => {
        setGameState('playing')
        setTimeLeft(15)
        setMood('thinking')
    }

    const handleTimeUp = () => {
        // skip round if time is up
        submitRound('--- timeout ---')
    }

    const submitRound = (connection: string) => {
        setHistory(prev => [...prev, { pair: pairs[currentRound], connection }])

        if (currentRound < 4) {
            setCurrentRound(r => r + 1)
            setTimeLeft(15)
            setConnectionInput('')
            setMood(Math.random() > 0.5 ? 'celebrating' : 'thinking') // random reaction
        } else {
            finishGame()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && connectionInput.trim() !== '') {
            submitRound(connectionInput.trim())
        }
    }

    const finishGame = async () => {
        setGameState('results')
        setMood('celebrating')

        // Log session to backend
        const rounds = history.map(h => ({
            conceptA: h.pair.conceptA,
            conceptB: h.pair.conceptB,
            user_connection: h.connection
        }))

        try {
            await fetch('http://localhost:8000/api/link-game/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rounds,
                    total_time_ms: 15000 * 5, // roughly
                    date: new Date().toISOString()
                })
            })

            // We should really auto-add these to the Mind Graph!
            for (const h of rounds) {
                if (h.user_connection === '--- timeout ---') continue

                // Add Concept A
                const resA = await fetch('http://localhost:8000/api/graph/nodes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: h.conceptA, category: 'link', source: 'link-game', color: '#ffea94' })
                })
                const nodeA = await resA.json()

                // Add Concept B
                const resB = await fetch('http://localhost:8000/api/graph/nodes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: h.conceptB, category: 'link', source: 'link-game', color: '#ffea94' })
                })
                const nodeB = await resB.json()

                // Add the connection
                const resConn = await fetch('http://localhost:8000/api/graph/nodes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: h.user_connection, category: 'idea', source: 'link-game', color: '#f36998' })
                })
                const nodeConn = await resConn.json()

                // Link them
                await fetch('http://localhost:8000/api/graph/connect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ source_id: nodeA.id, target_id: nodeConn.id, strength: 0.8 })
                })
                await fetch('http://localhost:8000/api/graph/connect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ source_id: nodeB.id, target_id: nodeConn.id, strength: 0.8 })
                })
            }

            onGraphUpdate()

        } catch (e) {
            console.error(e)
        }

        setTimeout(() => setMood('idle'), 3000)
    }

    const handleExport = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 600
        canvas.height = 800
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Background
        ctx.fillStyle = '#0a0812'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Border
        ctx.strokeStyle = '#ffea94'
        ctx.lineWidth = 4
        ctx.strokeRect(20, 20, 560, 760)

        ctx.fillStyle = '#ffea94'
        ctx.font = '24px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('ZUKURI // MIND SYNAPSE', 300, 80)
        ctx.fillText(new Date().toLocaleDateString(), 300, 110)

        let y = 180
        history.forEach(h => {
            ctx.fillStyle = '#65657a'
            ctx.font = '16px monospace'
            ctx.fillText(`${h.pair.conceptA} + ${h.pair.conceptB}`, 300, y)

            ctx.fillStyle = '#f36998'
            ctx.font = 'bold 24px monospace'
            ctx.fillText(h.connection, 300, y + 30)

            y += 100
        })

        const link = document.createElement('a')
        link.download = `zukuri-link-${Date.now()}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
    }

    const handleClose = () => {
        setGameState('intro')
        setMood('idle')
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0a0812]/90 backdrop-blur-md" onClick={handleClose} />

            <motion.div
                className="pixel-panel relative w-full max-w-lg bg-[#161625] overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
            >
                <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-muse-border bg-[#161625] z-10">
                    <h2 className="pixel-text text-[12px] tracking-wider pixel-glow-gold" style={{ color: 'var(--color-pixel-gold)' }}>
                        LINK // CREATIVE SPARK
                    </h2>
                    <button onClick={handleClose} className="pixel-btn-ghost text-[10px]">
                        [CLOSE]
                    </button>
                </div>

                <div className="p-8 min-h-[300px] flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        {gameState === 'intro' && (
                            <motion.div key="intro" className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <p className="pixel-text text-[10px] text-muse-text-dim mb-8 leading-relaxed max-w-sm mx-auto">
                                    Connect two unrelated ideas to spark a new node in your Mind Graph.
                                    <br /><br />
                                    You have 15 seconds per round.
                                </p>
                                <button onClick={handleStart} className="pixel-btn text-[12px] px-8 py-4">
                                    START IGNITION
                                </button>
                            </motion.div>
                        )}

                        {gameState === 'playing' && pairs.length > 0 && (
                            <motion.div key="playing" className="w-full text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="flex justify-between items-center mb-10 w-full px-4">
                                    <span className="pixel-text text-[10px] text-muse-text-dim">Round {currentRound + 1}/5</span>
                                    <span className={`pixel-text text-[12px] ${timeLeft <= 5 ? 'text-pixel-pink pixel-glow-pink' : 'text-pixel-gold'}`}>
                                        00:{timeLeft.toString().padStart(2, '0')}
                                    </span>
                                </div>

                                <div className="flex items-center justify-center gap-6 mb-10">
                                    <div className="pixel-panel px-6 py-4 bg-[#0a0812] border-pixel-gold">
                                        <span className="font-mono text-xl text-white">{pairs[currentRound].conceptA}</span>
                                    </div>
                                    <span className="pixel-text text-[14px] text-muse-text-dim animate-pulse">???</span>
                                    <div className="pixel-panel px-6 py-4 bg-[#0a0812] border-pixel-gold">
                                        <span className="font-mono text-xl text-white">{pairs[currentRound].conceptB}</span>
                                    </div>
                                </div>

                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={connectionInput}
                                    onChange={e => setConnectionInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="type connection..."
                                    className="w-full bg-[#0a0812] border border-muse-border p-4 text-center text-white font-mono placeholder:text-gray-700 outline-none focus:border-pixel-gold transition-colors"
                                />
                            </motion.div>
                        )}

                        {gameState === 'results' && (
                            <motion.div key="results" className="w-full text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <h3 className="pixel-text text-[14px] text-pixel-gold mb-6 pixel-glow-gold">SYNAPSE FORMED</h3>

                                <div className="space-y-4 mb-8 max-h-[150px] overflow-y-auto w-full text-left bg-[#0a0812] p-4 border border-muse-border">
                                    {history.map((h, i) => (
                                        <div key={i} className="flex flex-col border-b border-muse-border/30 pb-2">
                                            <div className="flex items-center justify-between opacity-50 text-[10px] font-mono">
                                                <span>{h.pair.conceptA}</span>
                                                <span>+</span>
                                                <span>{h.pair.conceptB}</span>
                                            </div>
                                            <div className="text-center font-mono text-pixel-pink mt-1">{h.connection}</div>
                                        </div>
                                    ))}
                                </div>

                                <p className="pixel-text text-[9px] text-muse-text-dim mb-6">
                                    Nodes successfully mapped to the Mind Graph.
                                </p>

                                <div className="flex items-center justify-center gap-4">
                                    <button onClick={handleExport} className="pixel-btn text-pixel-pink border-pixel-pink">
                                        EXPORT CARD
                                    </button>
                                    <button onClick={handleClose} className="pixel-btn">
                                        RETURN
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}
