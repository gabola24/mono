import { motion } from 'framer-motion'
import type { Message } from '../../stores/chatStore'

interface Props {
  message: Message
  isLatest: boolean
}

export default function MessageBubble({ message, isLatest }: Props) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-muse-accent/10 text-muse-text border border-muse-accent/20 rounded-br-sm'
            : 'bg-muse-surface-light text-muse-text border border-muse-border rounded-bl-sm'
        }`}
      >
        {!isUser && message.content === '' ? (
          <span className="inline-flex gap-1.5 py-1">
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--color-crt-amber)' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--color-crt-amber)' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--color-crt-amber)' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </span>
        ) : (
          message.content
        )}
      </div>
    </motion.div>
  )
}
