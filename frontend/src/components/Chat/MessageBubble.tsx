import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Message } from '../../stores/chatStore'
import { apiFetch } from '../../lib/api'
import { track } from '../../lib/analytics'

interface Props {
  message: Message
  isLatest: boolean
}

export default function MessageBubble({ message, isLatest }: Props) {
  const isUser = message.role === 'user'
  const [pinned, setPinned] = useState(false)

  const pinToGraph = async () => {
    if (pinned) return
    try {
      await apiFetch('/api/graph/nodes', {
        method: 'POST',
        body: JSON.stringify({ text: message.content.slice(0, 280), source: 'manual' }),
      })
      setPinned(true)
      track('note_pinned')
    } catch {
      // silent fail
    }
  }

  const bubbleEl = (
    <div
      className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-muse-accent/10 text-muse-text border border-muse-accent/20 rounded-br-sm'
          : 'bg-muse-surface-light text-muse-text border border-muse-border rounded-bl-sm'
      }`}
    >
      {!isUser && message.pending === 'image' ? (
        <span className="inline-flex flex-col gap-2">
          <span className="text-xs opacity-50">✦ generating inspiration...</span>
          <span className="inline-flex gap-1.5 py-1">
            {[0, 0.2, 0.4].map((delay) => (
              <motion.span
                key={delay}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--color-crt-amber)' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay }}
              />
            ))}
          </span>
        </span>
      ) : !isUser && message.image ? (
        <span className="flex flex-col gap-2">
          <img
            src={message.image.url}
            alt={message.image.prompt}
            className="rounded-lg w-full max-w-[280px] border border-muse-border"
            loading="lazy"
          />
          <span className="text-xs opacity-50 italic">{message.image.prompt}</span>
        </span>
      ) : !isUser && message.content === '' ? (
        <span className="inline-flex gap-1.5 py-1">
          {[0, 0.2, 0.4].map((delay) => (
            <motion.span
              key={delay}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--color-crt-amber)' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay }}
            />
          ))}
        </span>
      ) : (
        message.content
      )}
    </div>
  )

  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-center gap-1.5 group`}
    >
      {isUser && (
        <button
          onClick={pinToGraph}
          disabled={pinned}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono shrink-0
                     disabled:opacity-60 hover:text-pixel-pink text-muse-text-dim"
          style={{ color: pinned ? 'var(--color-pixel-pink)' : undefined }}
          title="Pin to mind graph"
        >
          {pinned ? '◆' : '◇'}
        </button>
      )}
      {bubbleEl}
    </motion.div>
  )
}
