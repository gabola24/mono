import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCompanionStore } from '../../stores/companionStore'
import { SPRITES } from './pixelSprites'

interface OnboardingFlowProps {
    onComplete: () => void
}

function SpriteImage({ svg, size = 120, className = "" }: { svg: string; size?: number; className?: string }) {
    const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    return <img src={encoded} width={size} style={{ imageRendering: 'pixelated' }} className={className} alt="mono pixel" />
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [step, setStep] = useState(0)
    const { setMood } = useCompanionStore()

    useEffect(() => {
        // Companion is "sleeping" until step 2
        if (step < 2) {
            setMood('idle')
        } else if (step === 2) {
            setMood('celebrating')
        } else {
            setMood('idle')
        }
    }, [step, setMood])

    const nextStep = () => setStep(s => s + 1)
    const sleepSprite = SPRITES.hatchling.idle[0]
    const awakeSprite = SPRITES.hatchling.idle[0] // or any frame representing wake

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
                        <div className="mb-4">
                            <SpriteImage svg={awakeSprite} className="drop-shadow-[0_0_15px_#ffea94]" />
                        </div>
                        <p className="pixel-text text-[14px] text-white tracking-widest mb-4">
                            I am MONO.
                        </p>
                        <p className="pixel-text text-[10px] text-muse-text-dim mb-8 max-w-sm leading-relaxed">
                            We are now linked. <br /><br />
                            Together, we will build your specific <b>ZUKURI</b>.
                            Checking in, writing notes, and exploring the web will help me grow.
                        </p>
                        <button onClick={() => {
                            localStorage.setItem('zukuri_onboarded', 'true')
                            onComplete()
                        }} className="pixel-btn px-6 py-2">
                            ENTER ZUKURI
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
