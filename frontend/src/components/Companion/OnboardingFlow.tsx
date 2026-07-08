import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCompanionStore } from '../../stores/companionStore'
import { SPRITES } from './pixelSprites'
import { apiFetch } from '../../lib/api'

interface OnboardingFlowProps {
    onComplete: () => void
}

function SpriteImage({ svg, size = 120, className = "" }: { svg: string; size?: number; className?: string }) {
    const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    return <img src={encoded} width={size} style={{ imageRendering: 'pixelated' }} className={className} alt="mono pixel" />
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [step, setStep] = useState(0)
    const [nameInput, setNameInput] = useState('Mono')
    const { setMood, setName, addXp } = useCompanionStore()

    useEffect(() => {
        if (step < 2) {
            setMood('idle')
        } else if (step === 3) {
            setMood('celebrating')
        } else {
            setMood('idle')
        }
    }, [step, setMood])

    const nextStep = () => setStep(s => s + 1)
    const sleepSprite = SPRITES.hatchling.idle[0]
    const awakeSprite = SPRITES.hatchling.idle[0]

    const handleEnter = async () => {
        const finalName = nameInput.trim() || 'Mono'
        setName(finalName)
        addXp(20)
        try {
            await apiFetch('/api/me', {
                method: 'PATCH',
                body: JSON.stringify({ onboarded: true }),
            })
        } catch {
            // fail open — localStorage fallback
        }
        localStorage.setItem('zukuri_onboarded', 'true')
        onComplete()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05040a]">
            <div className="absolute inset-0" />

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.div
                        key="0"
                        className="text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 1.5 } }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    >
                        <p className="pixel-text text-[10px] text-muse-text-dim mb-8">
                            System initializing...
                            <br />
                            Locating creative core...
                        </p>
                        <button onClick={nextStep} className="pixel-btn text-[10px] mt-4">
                            [ WAKE UP ]
                        </button>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div
                        key="1"
                        className="text-center flex flex-col items-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1, transition: { duration: 0.8 } }}
                        exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.2 } }}
                    >
                        <div className="mb-8 opacity-40 mix-blend-screen grayscale">
                            <SpriteImage svg={sleepSprite} className="animate-pulse" />
                        </div>
                        <p className="pixel-text text-[12px] text-pixel-gold pixel-glow-gold mb-8">
                            A dormant entity is detected.
                        </p>
                        <button onClick={nextStep} className="pixel-btn text-[12px] text-pixel-pink border-pixel-pink px-8 py-3">
                            CONNECT
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="2"
                        className="text-center flex flex-col items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.5 } }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    >
                        <div className="mb-6">
                            <SpriteImage svg={awakeSprite} className="drop-shadow-[0_0_15px_#ffea94]" />
                        </div>
                        <p className="pixel-text text-[12px] text-white tracking-widest mb-2">
                            Connection established.
                        </p>
                        <p className="pixel-text text-[10px] text-muse-text-dim mb-6">
                            What should I call myself?
                        </p>
                        <input
                            type="text"
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            maxLength={16}
                            className="bg-muse-surface border border-muse-border text-muse-text pixel-text text-[12px] text-center px-4 py-2 mb-6 w-40 outline-none focus:border-pixel-gold"
                            placeholder="Mono"
                            onKeyDown={e => { if (e.key === 'Enter') nextStep() }}
                        />
                        <button onClick={nextStep} className="pixel-btn px-6 py-2 text-[10px]">
                            SET NAME
                        </button>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="3"
                        className="text-center flex flex-col items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.5 } }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    >
                        <div className="mb-4">
                            <SpriteImage svg={awakeSprite} className="drop-shadow-[0_0_15px_#ffea94]" />
                        </div>
                        <p className="pixel-text text-[14px] text-white tracking-widest mb-4">
                            I am {nameInput.trim() || 'Mono'}.
                        </p>
                        <p className="pixel-text text-[10px] text-muse-text-dim mb-8 max-w-sm leading-relaxed">
                            We are now linked. <br /><br />
                            Together, we will build your specific <b>ZUKURI</b>.
                            Checking in, writing notes, and exploring the web will help me grow.
                        </p>
                        <button onClick={handleEnter} className="pixel-btn px-6 py-2">
                            ENTER ZUKURI
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
