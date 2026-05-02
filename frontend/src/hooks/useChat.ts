import { useCallback } from 'react'
import { useChatStore } from '../stores/chatStore'
import { useCompanionStore } from '../stores/companionStore'
import { useSkillTree } from './useSkillTree'

export function useChat(onAfterMessage?: () => void) {
  const {
    messages,
    conversationId,
    isStreaming,
    setConversationId,
    addMessage,
    appendToLast,
    setStreaming,
  } = useChatStore()

  const { setMood, addXp } = useCompanionStore()
  const { fetchTree, fetchSummary } = useSkillTree()

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return

      const userMsg = {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content,
      }
      addMessage(userMsg)
      setStreaming(true)
      setMood('thinking')

      const assistantMsg = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: '',
      }
      addMessage(assistantMsg)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            conversation_id: conversationId,
          }),
        })

        if (!res.ok) throw new Error('Chat request failed')

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No reader')

        const decoder = new TextDecoder()
        let buffer = ''
        let started = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = JSON.parse(line.slice(6))

            if (data.type === 'conversation_id') {
              setConversationId(data.value)
            } else if (data.type === 'token') {
              if (!started) {
                setMood('speaking')
                started = true
              }
              appendToLast(data.value)
            }
          }
        }

        addXp(10)

        // Refresh skill tree and mind graph from backend after chat stream closes.
        fetchTree()
        fetchSummary()
        onAfterMessage?.()

      } catch (err) {
        console.error('Chat error:', err)
        appendToLast('\n\n*Connection lost. Try again.*')
      } finally {
        setStreaming(false)
        setMood('idle')
      }
    },
    [conversationId, isStreaming, addMessage, appendToLast, setStreaming, setConversationId, setMood, addXp, fetchTree, fetchSummary, onAfterMessage]
  )

  return { messages, isStreaming, sendMessage }
}
