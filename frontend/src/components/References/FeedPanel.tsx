import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReferences } from '../../hooks/useReferences'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function FeedPanel({ isOpen, onClose }: Props) {
  const { references, isUploading, uploadText, uploadImage, deleteReference } =
    useReferences()
  const [textInput, setTextInput] = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim()) return
    await uploadText(textInput.trim(), textTitle.trim() || undefined)
    setTextInput('')
    setTextTitle('')
  }

  const handleFileDrop = useCallback(
    async (files: FileList) => {
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          await uploadImage(file)
        }
      }
    },
    [uploadImage]
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) handleFileDrop(e.dataTransfer.files)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-muse-bg
                        z-50 border-l border-muse-border flex flex-col overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-muse-border">
              <h2
                className="font-mono text-sm tracking-wider"
                style={{ color: 'var(--color-crt-amber)' }}
              >
                &gt; FEED_MUSE
              </h2>
              <button
                onClick={onClose}
                className="text-muse-text-dim hover:text-muse-text text-lg
                           font-mono transition-colors"
              >
                [x]
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Image drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-6 text-center cursor-pointer
                  transition-colors ${
                    dragOver
                      ? 'border-[var(--color-crt-amber)] bg-[var(--color-crt-amber)]/5'
                      : 'border-muse-border hover:border-muse-accent/40'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    e.target.files && handleFileDrop(e.target.files)
                  }
                />
                <p
                  className="font-mono text-lg mb-1"
                  style={{ color: 'var(--color-crt-amber)' }}
                >
                  [ + ]
                </p>
                <p className="text-xs text-muse-text-dim font-mono">
                  drop images or click to browse
                </p>
                <p className="text-[10px] text-muse-text-dim font-mono mt-1 opacity-60">
                  jpg · png · gif · webp
                </p>
              </div>

              {/* Text note input */}
              <form onSubmit={handleTextSubmit} className="space-y-2">
                <input
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="title (optional)"
                  className="w-full bg-muse-surface text-muse-text placeholder:text-muse-text-dim
                             rounded-lg px-3 py-2 text-xs font-mono outline-none border border-muse-border
                             focus:border-muse-accent/40 transition-colors"
                />
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="paste a note, idea, quote, reference..."
                  rows={3}
                  className="w-full bg-muse-surface text-muse-text placeholder:text-muse-text-dim
                             rounded-lg px-3 py-2 text-xs font-mono outline-none resize-none
                             border border-muse-border focus:border-muse-accent/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || isUploading}
                  className="w-full rounded-lg py-2 text-xs font-mono font-medium
                             disabled:opacity-20 hover:brightness-125 transition-all border"
                  style={{
                    background: 'var(--color-crt-amber)',
                    color: '#080808',
                    borderColor: 'var(--color-crt-amber)',
                  }}
                >
                  {isUploading ? '[ feeding... ]' : '[ feed text ]'}
                </button>
              </form>

              {/* Reference list */}
              {references.length > 0 && (
                <div>
                  <h3
                    className="text-[10px] uppercase tracking-[0.2em] font-mono mb-3"
                    style={{ color: 'var(--color-crt-amber)', opacity: 0.6 }}
                  >
                    digested ({references.length})
                  </h3>
                  <div className="space-y-2">
                    {references.map((ref) => (
                      <motion.div
                        key={ref.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-muse-surface rounded-lg p-3 border border-muse-border group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="text-[9px] uppercase tracking-widest font-mono"
                                style={{ color: 'var(--color-crt-amber)' }}
                              >
                                {ref.type}
                              </span>
                              <span className="text-xs text-muse-text truncate font-mono">
                                {ref.title}
                              </span>
                            </div>
                            {ref.type === 'image' && ref.file_path && (
                              <img
                                src={ref.file_path}
                                alt={ref.title}
                                className="w-full h-24 object-cover rounded mt-1 opacity-80"
                              />
                            )}
                            <p className="text-[11px] text-muse-text-dim line-clamp-2 mt-1 font-mono">
                              {ref.content}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteReference(ref.id)}
                            className="text-muse-text-dim hover:text-red-400 text-xs font-mono
                                       opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            [x]
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
