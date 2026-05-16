import { useEffect, useRef } from 'react'
import { useGameLoop } from './useGameLoop'
import { renderToLines, renderHud } from './render'

interface Props {
  onClose: () => void
}

export default function AlienAttack({ onClose }: Props) {
  const { state, handleKeyDown, handleKeyUp, restart } = useGameLoop()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        onClose()
        return
      }
      if (state.status === 'gameover' && e.code === 'KeyR') {
        restart()
        return
      }
      handleKeyDown(e)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp, restart, onClose, state.status])

  const lines = renderToLines(state)
  const hud = renderHud(state)

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="outline-none flex flex-col items-center w-full select-none"
    >
      {/* HUD */}
      <pre
        className="font-mono text-[9px] leading-tight text-muse-text-dim w-full px-1 mb-1"
        aria-hidden
      >
        {hud}
      </pre>

      {/* Playfield */}
      <div className="relative w-full border border-muse-border bg-muse-bg">
        <pre
          className="font-mono text-[9px] leading-tight text-muse-text w-full px-1 py-0.5"
          aria-hidden
        >
          {lines.join('\n')}
        </pre>

        {/* Pause overlay */}
        {state.status === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center bg-muse-bg/80">
            <span className="pixel-text text-[12px] text-pixel-gold pixel-glow-gold animate-pulse">
              PAUSED — P to resume
            </span>
          </div>
        )}

        {/* Game over overlay */}
        {state.status === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muse-bg/90">
            <span className="pixel-text text-[12px] text-pixel-pink pixel-glow-pink">GAME OVER</span>
            <span className="pixel-text text-[10px] text-muse-text-dim">score: {state.score}</span>
            <div className="flex gap-3 mt-2">
              <button onClick={restart} className="pixel-btn text-[9px]">
                [R] RETRY
              </button>
              <button onClick={onClose} className="pixel-btn-ghost text-[9px]">
                [ESC] LEAVE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <p className="pixel-text text-[8px] text-muse-text-dim mt-2 text-center">
        ←/→ move &nbsp;·&nbsp; SPACE fire &nbsp;·&nbsp; P pause &nbsp;·&nbsp; ESC leave
      </p>
    </div>
  )
}
