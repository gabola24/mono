import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCompanionStore } from '../stores/companionStore'
import { useAuthStore } from '../stores/authStore'

interface TestPanelProps {
    isOpen: boolean
    onClose: () => void
}

export default function TestPanel({ isOpen, onClose }: TestPanelProps) {
    const { addXp, loseXp } = useCompanionStore()
    const { logout } = useAuthStore()

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-y-0 right-0 w-80 bg-muse-surface border-l border-muse-border z-50 p-6 flex flex-col gap-4 shadow-2xl"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
                <div className="flex items-center justify-between">
                    <h2 className="pixel-text text-pixel-gold">🧪 Test Module</h2>
                    <button onClick={onClose} className="pixel-btn-ghost text-muse-text-dim text-lg">×</button>
                </div>

                <div className="flex flex-col gap-4 mt-4">
                    <div className="p-4 bg-[#0a0812] border border-muse-border rounded">
                        <h3 className="text-sm font-bold text-muse-accent mb-2">Pet Controls</h3>
                        <button
                            className="pixel-btn w-full text-left flex justify-between items-center"
                            onClick={() => addXp(50)}
                        >
                            <span>+ Add 50 XP</span>
                            <span className="text-pixel-gold">⬆️</span>
                        </button>
                        <button
                            className="pixel-btn w-full text-left flex justify-between items-center mt-2"
                            style={{ borderColor: '#f87171', color: '#f87171' }}
                            onClick={() => loseXp(30)}
                        >
                            <span>- Lose 30 XP</span>
                            <span>⬇️</span>
                        </button>
                        <button
                            className="pixel-btn w-full text-left flex justify-between items-center mt-2"
                            style={{ borderColor: '#fb923c', color: '#fb923c' }}
                            onClick={() => loseXp(10)}
                        >
                            <span>Simulate Missed Day</span>
                            <span>💤</span>
                        </button>
                        <p className="text-[10px] text-muse-text-dim mt-2">
                            XP changes to test leveling and decay mechanics.
                        </p>
                    </div>

                    <div className="p-4 bg-[#0a0812] border border-muse-border rounded">
                        <h3 className="text-sm font-bold text-muse-accent mb-2">Graph Controls</h3>
                        <button
                            className="pixel-btn border-pixel-blue text-pixel-blue w-full text-left"
                            onClick={() => {
                                alert("Node connection simulation fired! (Check console for potential errors or check your test hooks depending on backend).")
                            }}
                        >
                            Simulate Node Connect
                        </button>
                        <p className="text-[10px] text-muse-text-dim mt-2">
                            (Placeholder) Fire off a graph event manually.
                        </p>
                    </div>

                    <div className="mt-8 p-4 bg-red-900/20 border border-red-500/50 rounded">
                        <h3 className="text-sm font-bold text-red-400 mb-2">Danger Zone</h3>
                        <button
                            className="pixel-btn text-white w-full border-red-500 mb-2"
                            onClick={() => {
                                localStorage.clear()
                                window.location.reload()
                            }}
                        >
                            Nuke State & Reload
                        </button>
                        <button
                            className="pixel-btn text-pixel-gold w-full border-pixel-gold"
                            onClick={logout}
                        >
                            Log Out User
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
