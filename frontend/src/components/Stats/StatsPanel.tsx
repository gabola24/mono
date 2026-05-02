import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface DailyStat {
    id: number
    date: string
    energy: number
    focus: number
    mood: number
    creative: number
}

interface StatsPanelProps {
    isOpen: boolean
    onClose: () => void
    onCheckIn: (stats: Omit<DailyStat, 'id' | 'date'>) => void
    history: DailyStat[]
}

function PixelBar({
    label, value, color, onChange
}: {
    label: string; value: number; color: string; onChange?: (val: number) => void
}) {
    const isEditable = onChange !== undefined

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isEditable) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
        // Snap to 10% increments
        const snapped = Math.round(percent / 10) * 10
        onChange(snapped)
    }

    return (
        <div className="flex items-center gap-3 w-full">
            <div className="w-20 pixel-text text-[8px]" style={{ color: 'var(--color-muse-text-dim)' }}>
                {label}
            </div>
            <div className="flex-1">
                <div
                    className="w-full pixel-bar-track relative"
                    style={{ cursor: isEditable ? 'pointer' : 'default', height: '12px' }}
                    onClick={handleClick}
                >
                    <motion.div
                        className="pixel-bar-fill shadow-[inset_-2px_0_0_rgba(0,0,0,0.2)]"
                        style={{
                            background: color,
                            width: `${Math.max(2, value)}%`,
                            borderRight: '1px solid rgba(255,255,255,0.2)',
                            borderTop: '1px solid rgba(255,255,255,0.4)',
                        }}
                        initial={false}
                        animate={{ width: `${Math.max(2, value)}%` }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                    />
                </div>
            </div>
            <div className="w-8 text-right pixel-text text-[8px]" style={{ color }}>
                {value}%
            </div>
        </div>
    )
}

function RadarChart({ current }: { current: Omit<DailyStat, 'id' | 'date'> }) {
    const size = 120
    const center = size / 2
    const maxRadius = size / 2 - 10

    // order: Energy (top), Focus (right), Creative (bottom), Mood (left)
    const stats = [
        { val: current.energy, angle: -Math.PI / 2, color: 'var(--color-pixel-orange)' },
        { val: current.focus, angle: 0, color: 'var(--color-pixel-blue)' },
        { val: current.creative, angle: Math.PI / 2, color: 'var(--color-pixel-pink)' },
        { val: current.mood, angle: Math.PI, color: 'var(--color-pixel-mint)' }
    ]

    const points = stats.map(s => {
        const r = (s.val / 100) * maxRadius
        return `${center + r * Math.cos(s.angle)},${center + r * Math.sin(s.angle)}`
    }).join(' ')

    return (
        <div className="relative flex flex-col items-center justify-center p-4">
            <svg width={size} height={size} className="overflow-visible" style={{ imageRendering: 'pixelated' }}>
                {/* Background grid */}
                {[0.2, 0.4, 0.6, 0.8, 1].map((r) => (
                    <polygon
                        key={r}
                        points={stats.map(s => {
                            const rad = r * maxRadius
                            return `${center + rad * Math.cos(s.angle)},${center + rad * Math.sin(s.angle)}`
                        }).join(' ')}
                        fill="none"
                        stroke="var(--color-muse-border)"
                        strokeWidth="1"
                        opacity="0.5"
                    />
                ))}
                {/* Axes */}
                {stats.map((s, i) => (
                    <line
                        key={`axis-${i}`}
                        x1={center} y1={center}
                        x2={center + maxRadius * Math.cos(s.angle)}
                        y2={center + maxRadius * Math.sin(s.angle)}
                        stroke="var(--color-muse-border)"
                        strokeWidth="1"
                    />
                ))}
                {/* Data polygon */}
                <polygon
                    points={points}
                    fill="var(--color-muse-accent-glow)"
                    stroke="var(--color-pixel-pink)"
                    strokeWidth="2"
                    className="transition-all duration-300 ease-out"
                />
                {/* Data points */}
                {stats.map((s, i) => {
                    const r = (s.val / 100) * maxRadius
                    return (
                        <circle
                            key={`pt-${i}`}
                            cx={center + r * Math.cos(s.angle)}
                            cy={center + r * Math.sin(s.angle)}
                            r="3"
                            fill={s.color}
                            className="transition-all duration-300 ease-out"
                        />
                    )
                })}
            </svg>
            {/* Labels */}
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 pixel-text text-[7px]" style={{ color: 'var(--color-pixel-orange)' }}>ENERGY</span>
            <span className="absolute top-1/2 right-0 translate-x-2 -translate-y-1/2 pixel-text text-[7px]" style={{ color: 'var(--color-pixel-blue)' }}>FOCUS</span>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 pixel-text text-[7px]" style={{ color: 'var(--color-pixel-pink)' }}>CREATIVE</span>
            <span className="absolute top-1/2 left-0 -translate-x-3 -translate-y-1/2 pixel-text text-[7px]" style={{ color: 'var(--color-pixel-mint)' }}>MOOD</span>
        </div>
    )
}

export default function StatsPanel({ isOpen, onClose, onCheckIn, history }: StatsPanelProps) {
    const [form, setForm] = useState({ energy: 60, focus: 60, mood: 60, creative: 60 })
    const [hasCheckedIn, setHasCheckedIn] = useState(false)

    // Auto-fill from today's history if it exists
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]
        const todayStat = history.find(s => s.date === today)
        if (todayStat) {
            setForm({
                energy: todayStat.energy,
                focus: todayStat.focus,
                mood: todayStat.mood,
                creative: todayStat.creative
            })
            setHasCheckedIn(true)
        } else {
            setHasCheckedIn(false)
        }
    }, [history])

    const handleSave = () => {
        onCheckIn(form)
        setHasCheckedIn(true)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-[#0f0e1a]/80 backdrop-blur-sm" onClick={onClose} />

                    {/* Panel */}
                    <motion.div
                        className="pixel-panel relative w-full max-w-sm flex flex-col overflow-hidden"
                        initial={{ scale: 0.95, y: 10, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 10, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-muse-border bg-[#161625]">
                            <h2 className="pixel-text text-[10px] tracking-wider pixel-glow-gold" style={{ color: 'var(--color-pixel-gold)' }}>
                                CHARACTER SHEET
                            </h2>
                            <button onClick={onClose} className="pixel-btn-ghost">
                                [X]
                            </button>
                        </div>

                        <div className="p-5 flex flex-col gap-6">
                            {/* Radar Chart */}
                            <div className="flex justify-center bg-[#0a0812] rounded-lg border border-muse-border p-2">
                                <RadarChart current={form} />
                            </div>

                            {/* Progress Bars */}
                            <div className="flex flex-col gap-4">
                                <PixelBar
                                    label="ENERGY" value={form.energy} color="var(--color-pixel-orange)"
                                    onChange={val => setForm(f => ({ ...f, energy: val }))}
                                />
                                <PixelBar
                                    label="FOCUS" value={form.focus} color="var(--color-pixel-blue)"
                                    onChange={val => setForm(f => ({ ...f, focus: val }))}
                                />
                                <PixelBar
                                    label="MOOD" value={form.mood} color="var(--color-pixel-mint)"
                                    onChange={val => setForm(f => ({ ...f, mood: val }))}
                                />
                                <PixelBar
                                    label="CREATIVE" value={form.creative} color="var(--color-pixel-pink)"
                                    onChange={val => setForm(f => ({ ...f, creative: val }))}
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col gap-2 mt-2">
                                <button
                                    onClick={handleSave}
                                    className="pixel-btn w-full py-3 text-[10px]"
                                    style={{
                                        background: hasCheckedIn ? 'var(--color-muse-surface-light)' : 'var(--color-pixel-pink)',
                                        color: hasCheckedIn ? 'var(--color-pixel-pink)' : '#000',
                                        boxShadow: hasCheckedIn ? 'none' : 'inset -2px -2px 0 rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {hasCheckedIn ? 'UPDATE CHECK-IN' : 'CHECK IN TODAY'}
                                </button>
                                {hasCheckedIn && (
                                    <button
                                        onClick={() => {
                                            const canvas = document.createElement('canvas')
                                            canvas.width = 600
                                            canvas.height = 600
                                            const ctx = canvas.getContext('2d')
                                            if (!ctx) return

                                            ctx.fillStyle = '#0a0812'
                                            ctx.fillRect(0, 0, canvas.width, canvas.height)

                                            ctx.strokeStyle = '#ffea94'
                                            ctx.lineWidth = 4
                                            ctx.strokeRect(20, 20, 560, 560)

                                            ctx.fillStyle = '#ffea94'
                                            ctx.font = 'bold 28px monospace'
                                            ctx.textAlign = 'center'
                                            ctx.fillText('ZUKURI // DAILY CHECK-IN', 300, 80)
                                            ctx.font = '20px monospace'
                                            ctx.fillText(new Date().toLocaleDateString(), 300, 115)

                                            ctx.textAlign = 'left'
                                            ctx.font = 'bold 22px monospace'
                                            const stats = [
                                                { label: 'ENERGY', val: form.energy, color: '#ffbd2e' },
                                                { label: 'FOCUS', val: form.focus, color: '#82aaff' },
                                                { label: 'MOOD', val: form.mood, color: '#c3e88d' },
                                                { label: 'CREATIVE', val: form.creative, color: '#f36998' }
                                            ]

                                            let y = 200
                                            stats.forEach(s => {
                                                ctx.fillStyle = s.color
                                                ctx.fillText(s.label.padEnd(10, ' ') + s.val + '%', 100, y)
                                                ctx.fillRect(100, y + 20, (s.val / 100) * 400, 24)
                                                y += 85
                                            })

                                            const link = document.createElement('a')
                                            link.download = `zukuri-stats-${Date.now()}.png`
                                            link.href = canvas.toDataURL('image/png')
                                            link.click()
                                        }}
                                        className="pixel-btn text-[10px] bg-[#161625]"
                                    >
                                        EXPORT STAT CARD
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
