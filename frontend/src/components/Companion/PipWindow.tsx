import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import CompanionAvatar from './CompanionAvatar'
import type { DailyStat } from '../Stats/StatsPanel'

// Types for documentPictureInPicture API (experimental)
declare global {
    interface Window {
        documentPictureInPicture?: {
            requestWindow(options?: any): Promise<Window>
        }
    }
}

export default function PipWindow({ dailyStat }: { dailyStat?: DailyStat }) {
    const [isPipOpen, setIsPipOpen] = useState(false)
    const [pipWindow, setPipWindow] = useState<Window | null>(null)
    const [pipSupported, setPipSupported] = useState(false)

    // fallback draggable state
    const [useFallback, setUseFallback] = useState(false)

    useEffect(() => {
        if ('documentPictureInPicture' in window) {
            setPipSupported(true)
        }
    }, [])

    const startPip = async () => {
        if (pipSupported && window.documentPictureInPicture) {
            try {
                const pipWin = await window.documentPictureInPicture.requestWindow({
                    width: 300,
                    height: 400,
                })

                // Copy styles
                Array.from(document.styleSheets).forEach((styleSheet) => {
                    try {
                        if (styleSheet.cssRules) {
                            const newStyleEl = document.createElement('style')
                            Array.from(styleSheet.cssRules).forEach((rule) => {
                                newStyleEl.appendChild(document.createTextNode(rule.cssText))
                            })
                            pipWin.document.head.appendChild(newStyleEl)
                        }
                    } catch (e) {
                        const linkEl = document.createElement('link')
                        linkEl.rel = 'stylesheet'
                        linkEl.type = styleSheet.type
                        linkEl.media = styleSheet.media.mediaText
                        if (styleSheet.href) linkEl.href = styleSheet.href
                        pipWin.document.head.appendChild(linkEl)
                    }
                })

                // Ensure variables from root are copied
                const html = document.querySelector('html')
                if (html) {
                    pipWin.document.documentElement.className = html.className
                    pipWin.document.documentElement.style.cssText = html.style.cssText
                }

                pipWin.addEventListener('pagehide', () => {
                    setIsPipOpen(false)
                    setPipWindow(null)
                })

                setPipWindow(pipWin)
                setIsPipOpen(true)
                setUseFallback(false)
            } catch (e) {
                console.error('PiP failed', e)
                setUseFallback(true) // fallback
            }
        } else {
            setUseFallback(true)
        }
    }

    const closePip = () => {
        if (pipWindow) {
            pipWindow.close()
        }
        setIsPipOpen(false)
        setPipWindow(null)
        setUseFallback(false)
    }

    const companionContent = (
        <div className="flex flex-col items-center justify-center p-4 h-full bg-[#0a0812]">
            <CompanionAvatar />

            {dailyStat && (
                <div className="mt-2 flex gap-3 p-2 bg-muse-surface border border-muse-border rounded">
                    <div className="flex flex-col items-center">
                        <span className="pixel-text text-[6px] text-muse-text-dim">ENG</span>
                        <span className="pixel-text text-[8px] text-pixel-gold pt-1">{dailyStat.energy}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="pixel-text text-[6px] text-muse-text-dim">FOC</span>
                        <span className="pixel-text text-[8px] text-pixel-blue pt-1">{dailyStat.focus}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="pixel-text text-[6px] text-muse-text-dim">CRT</span>
                        <span className="pixel-text text-[8px] text-pixel-pink pt-1">{dailyStat.creative}</span>
                    </div>
                </div>
            )}

            {(isPipOpen || useFallback) && (
                <button onClick={closePip} className="pixel-btn text-[8px] mt-4 z-50 bg-[#161625]">
                    RETURN
                </button>
            )}
        </div>
    )

    if (pipWindow && isPipOpen) {
        return (
            <>
                {createPortal(companionContent, pipWindow.document.body)}
                <div className="flex flex-col items-center py-8">
                    <span className="pixel-text text-[10px] text-muse-text-dim mb-4">
                        Mono is running in external PiP.
                    </span>
                    <button onClick={closePip} className="pixel-btn">
                        Recall Companion
                    </button>
                </div>
            </>
        )
    }

    return (
        <>
            {!useFallback && (
                <div className="relative group">
                    <CompanionAvatar />
                    <button
                        onClick={startPip}
                        className="absolute top-4 right-4 pixel-btn-ghost text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        🪟 POP OUT
                    </button>
                </div>
            )}

            {useFallback && (
                <AnimatePresence>
                    <motion.div
                        drag
                        dragMomentum={false}
                        className="fixed bottom-4 right-4 z-50 cursor-move border-2 border-muse-border bg-[#161625] shadow-xl p-2"
                        style={{ width: 250, height: 320 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {companionContent}
                    </motion.div>
                </AnimatePresence>
            )}
        </>
    )
}
