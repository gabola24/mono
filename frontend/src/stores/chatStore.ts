import { create } from 'zustand'

export interface MessageImage {
  url: string
  prompt: string
  refIds?: string[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  image?: MessageImage
  pending?: 'image'
}

interface ChatState {
  messages: Message[]
  conversationId: string | null
  isStreaming: boolean
  setConversationId: (id: string) => void
  addMessage: (msg: Message) => void
  appendToLast: (token: string) => void
  updateLast: (updater: (msg: Message) => Message) => void
  setStreaming: (val: boolean) => void
  reset: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  conversationId: null,
  isStreaming: false,
  setConversationId: (id) => set({ conversationId: id }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  appendToLast: (token) =>
    set((s) => {
      const msgs = [...s.messages]
      const last = msgs[msgs.length - 1]
      if (last && last.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + token }
      }
      return { messages: msgs }
    }),
  updateLast: (updater) =>
    set((s) => {
      const msgs = [...s.messages]
      const last = msgs[msgs.length - 1]
      if (last && last.role === 'assistant') {
        msgs[msgs.length - 1] = updater(last)
      }
      return { messages: msgs }
    }),
  setStreaming: (val) => set({ isStreaming: val }),
  reset: () => set({ messages: [], conversationId: null, isStreaming: false }),
}))
