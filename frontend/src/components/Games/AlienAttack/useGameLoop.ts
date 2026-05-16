import { useEffect, useRef, useState, useCallback } from 'react'
import { createInitialState, nextWave, step, type GameState, type Input } from './engine'

const TARGET_FPS = 30
const FRAME_MS = 1000 / TARGET_FPS

export function useGameLoop() {
  const [state, setState] = useState<GameState>(createInitialState)
  const inputRef = useRef<Input>({ left: false, right: false, fire: false, pause: false })
  const lastFrameRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const stateRef = useRef<GameState>(state)
  stateRef.current = state

  const tick = useCallback((now: number) => {
    if (now - lastFrameRef.current >= FRAME_MS) {
      lastFrameRef.current = now
      const input = { ...inputRef.current }
      inputRef.current.pause = false  // consume pause toggle
      setState((prev) => {
        const next = step(prev, input)
        // Auto-advance to next wave after a brief pause
        if (next.status === 'wave_clear') {
          return nextWave(next)
        }
        return next
      })
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick])

  // Pause when window loses focus
  useEffect(() => {
    const onBlur = () => setState((s) => s.status === 'playing' ? { ...s, status: 'paused' } : s)
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        inputRef.current.left = true
        e.preventDefault()
        break
      case 'ArrowRight':
      case 'KeyD':
        inputRef.current.right = true
        e.preventDefault()
        break
      case 'Space':
        inputRef.current.fire = true
        e.preventDefault()
        break
      case 'KeyP':
        inputRef.current.pause = true
        e.preventDefault()
        break
    }
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        inputRef.current.left = false
        break
      case 'ArrowRight':
      case 'KeyD':
        inputRef.current.right = false
        break
      case 'Space':
        inputRef.current.fire = false
        break
    }
  }, [])

  const restart = useCallback(() => {
    setState(createInitialState())
  }, [])

  return { state, handleKeyDown, handleKeyUp, restart }
}
