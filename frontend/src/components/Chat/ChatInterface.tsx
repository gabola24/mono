import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useChat } from '../../hooks/useChat'
import MessageBubble from './MessageBubble'

interface ChatInterfaceProps {
  onAfterMessage?: () => void
}

export default function ChatInterface({ onAfterMessage }: ChatInterfaceProps) {
  const { messages, isStreaming, sendMessage } = useChat(onAfterMessage)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center h-full"
          >
            <div className="text-center px-4">
              <p
                className="font-mono text-base mb-3"
                style={{ color: 'var(--color-muse-text-dim)' }}
              >
                Tell me what's on your mind...
              </p>
              <p className="text-muse-text-dim text-xs font-display italic opacity-50">
                thoughts, plans, questions — anything
              </p>
            </div>
          </motion.div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isLatest={i === messages.length - 1}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-muse-border">
        <div className="flex items-end gap-3 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <span
              className="absolute left-3 top-3 text-xs font-mono select-none"
              style={{ color: 'var(--color-crt-amber)', opacity: 0.5 }}
            >
              &gt;
            </span>
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind?"
              rows={1}
              disabled={isStreaming}
              className="w-full bg-muse-surface text-muse-text placeholder:text-muse-text-dim
                         rounded-xl pl-7 pr-4 py-3 text-sm resize-none outline-none
                         border border-muse-border focus:border-muse-accent/40
                         transition-colors disabled:opacity-50 font-mono"
            />
          </div>
          <motion.button
            type="submit"
            disabled={isStreaming || !input.trim()}
            whileTap={{ scale: 0.95 }}
            className="rounded-xl px-5 py-3 text-sm font-medium font-mono
                       disabled:opacity-20 disabled:cursor-not-allowed
                       hover:brightness-125 transition-all border"
            style={{
              background: 'var(--color-crt-amber)',
              color: '#080808',
              borderColor: 'var(--color-crt-amber)',
            }}
          >
            Send
          </motion.button>
        </div>
      </form>
    </div>
  )
}
