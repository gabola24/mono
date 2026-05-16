import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRandomPairs, type ConceptPair } from '../../game/concepts'
import { useCompanionStore } from '../../stores/companionStore'

interface LinkGameProps {
  onClose: () => void
  onAfterPlay?: () => void
}

export default function LinkGame({ onClose, onAfterPlay }: LinkGameProps) {
  const [pairs, setPairs] = useState<ConceptPair[]>([])
  const [currentRound, setCurrentRound] = useState(0)
  const [connectionInput, setConnectionInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(15)
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'results'>('intro')
  const [history, setHistory] = useState<{ pair: ConceptPair; connection: string }[]>([])

  const sessionStartRef = useRef<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const { setMood } = useCompanionStore()

  useEffect(() => {
    setPairs(getRandomPairs(5))
  }, [])

  // Timer countdown
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    } else if (gameState === 'playing' && timeLeft === 0) {
      submitRound('--- timeout ---')
    }
    return () => clearTimeout(timer)
  }, [gameState, timeLeft])

  // Auto-focus input on each round
  useEffect(() => {
    if (gameState === 'playing') {
      inputRef.current?.focus()
    }
  }, [gameState, currentRound])

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleStart = () => {
    sessionStartRef.current = Date.now()
    setGameState('playing')
    setTimeLeft(15)
    setMood('thinking')
  }

  const handlePlayAgain = () => {
    setPairs(getRandomPairs(5))
    setHistory([])
    setCurrentRound(0)
    setTimeLeft(15)
    setConnectionInput('')
    setGameState('playing')
    sessionStartRef.current = Date.now()
    setMood('thinking')
  }

  const submitRound = (connection: string) => {
    const newHistory = [...history, { pair: pairs[currentRound], connection }]
    setHistory(newHistory)

    const isSkipped = ['--- timeout ---', '--- skip ---'].includes(connection)
    if (isSkipped) {
      setMood('thinking')
    } else {
      setMood('celebrating')
    }

    if (currentRound < 4) {
      setCurrentRound((r) => r + 1)
      setTimeLeft(15)
      setConnectionInput('')
    } else {
      finishGame(newHistory)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && connectionInput.trim() !== '') {
      submitRound(connectionInput.trim())
    }
  }

  const finishGame = async (finalHistory: { pair: ConceptPair; connection: string }[]) => {
    setGameState('results')
    setMood('celebrating')

    const totalMs = sessionStartRef.current ? Date.now() - sessionStartRef.current : 75000

    const rounds = finalHistory.map((h) => ({
      conceptA: h.pair.conceptA,
      conceptB: h.pair.conceptB,
      user_connection: h.connection,
    }))

    try {
      await fetch('/api/link-game/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rounds,
          total_time_ms: totalMs,
          date: new Date().toISOString(),
        }),
      })
      onAfterPlay?.()
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

    ctx.fillStyle = '#F1EFE9'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = '#97B1A6'
    ctx.lineWidth = 3
    ctx.strokeRect(20, 20, 560, 760)

    ctx.fillStyle = '#3d3935'
    ctx.font = '20px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('ZUKURI // MIND SYNAPSE', 300, 75)
    ctx.fillStyle = '#97B1A6'
    ctx.font = '13px monospace'
    ctx.fillText(new Date().toLocaleDateString(), 300, 100)

    let y = 180
    history.forEach((h) => {
      ctx.fillStyle = '#97B1A6'
      ctx.font = '13px monospace'
      ctx.fillText(`${h.pair.conceptA}  +  ${h.pair.conceptB}`, 300, y)

      ctx.fillStyle = '#F5BEB0'
      ctx.font = 'bold 20px monospace'
      ctx.fillText(h.connection, 300, y + 28)

      y += 90
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

  return (
    <div className="w-full">
      <div className="p-8 min-h-[320px] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {gameState === 'intro' && (
            <motion.div
              key="intro"
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="pixel-text text-[10px] text-muse-text-dim mb-8 leading-relaxed max-w-sm mx-auto">
                Connect two unrelated ideas to spark a new node in your Mind Graph.
                <br />
                <br />
                You have 15 seconds per round.
              </p>
              <button onClick={handleStart} className="pixel-btn text-[12px] px-8 py-4">
                START IGNITION
              </button>
            </motion.div>
          )}

          {gameState === 'playing' && pairs.length > 0 && (
            <motion.div
              key="playing"
              className="w-full text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header row */}
              <div className="flex justify-between items-center mb-6 w-full px-2">
                <span className="pixel-text text-[10px] text-muse-text-dim">
                  Round {currentRound + 1}/5
                </span>
                <span
                  className={`pixel-text text-[12px] ${
                    timeLeft <= 5 ? 'text-pixel-pink pixel-glow-pink' : 'text-pixel-gold'
                  }`}
                >
                  00:{timeLeft.toString().padStart(2, '0')}
                </span>
              </div>

              {/* Round progress dots */}
              <div className="flex gap-2 justify-center mb-8">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 border transition-all ${
                      i < currentRound
                        ? 'bg-pixel-gold border-pixel-gold'
                        : i === currentRound
                          ? 'border-pixel-gold bg-pixel-gold/30 animate-pulse'
                          : 'border-muse-border'
                    }`}
                  />
                ))}
              </div>

              {/* Concept cards */}
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="pixel-panel px-5 py-3 border-muse-border">
                  <span className="font-mono text-lg text-muse-text">{pairs[currentRound].conceptA}</span>
                </div>
                <span className="pixel-text text-[14px] text-muse-text-dim animate-pulse">???</span>
                <div className="pixel-panel px-5 py-3 border-muse-border">
                  <span className="font-mono text-lg text-muse-text">{pairs[currentRound].conceptB}</span>
                </div>
              </div>

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={connectionInput}
                onChange={(e) => setConnectionInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="type connection..."
                className="panel-input w-full text-center mb-3"
              />

              {/* Skip */}
              <button
                onClick={() => submitRound('--- skip ---')}
                className="pixel-btn-ghost text-[9px] text-muse-text-dim"
              >
                [skip]
              </button>
            </motion.div>
          )}

          {gameState === 'results' && (
            <motion.div
              key="results"
              className="w-full text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="pixel-text text-[14px] text-pixel-gold mb-6 pixel-glow-gold">
                SYNAPSE FORMED
              </h3>

              <div className="space-y-4 mb-8 overflow-y-auto w-full text-left bg-muse-bg p-4 border border-muse-border"
                style={{ maxHeight: '220px' }}
              >
                {history.map((h, i) => (
                  <div key={i} className="flex flex-col border-b border-muse-border/30 pb-2">
                    <div className="flex items-center justify-between opacity-50 text-[10px] font-mono">
                      <span>{h.pair.conceptA}</span>
                      <span>+</span>
                      <span>{h.pair.conceptB}</span>
                    </div>
                    <div className={`text-center font-mono mt-1 text-sm ${
                      ['--- timeout ---', '--- skip ---'].includes(h.connection)
                        ? 'opacity-30 italic text-xs'
                        : 'text-pixel-gold'
                    }`}>
                      {['--- timeout ---', '--- skip ---'].includes(h.connection)
                        ? 'skipped'
                        : h.connection}
                    </div>
                  </div>
                ))}
              </div>

              <p className="pixel-text text-[9px] text-muse-text-dim mb-6">
                Nodes successfully mapped to the Mind Graph.
              </p>

              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button onClick={handleExport} className="pixel-btn text-pixel-pink border-pixel-pink">
                  EXPORT CARD
                </button>
                <button onClick={handlePlayAgain} className="pixel-btn text-pixel-gold border-pixel-gold">
                  PLAY AGAIN
                </button>
                <button onClick={handleClose} className="pixel-btn-ghost text-[11px]">
                  RETURN
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
