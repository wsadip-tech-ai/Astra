'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Session {
  id: string
  title: string
  updated_at: string
  message_count?: number
}

interface ChatSidebarProps {
  sessions: Session[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onNewChat: () => void
  onDeleteSession: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

function groupByDate(sessions: Session[]): Record<string, Session[]> {
  const groups: Record<string, Session[]> = {}
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86400000)
  const weekStart = new Date(todayStart.getTime() - 7 * 86400000)

  for (const s of sessions) {
    const d = new Date(s.updated_at)
    let label: string
    if (d >= todayStart) label = 'Today'
    else if (d >= yesterdayStart) label = 'Yesterday'
    else if (d >= weekStart) label = 'This Week'
    else label = 'Older'

    if (!groups[label]) groups[label] = []
    groups[label].push(s)
  }

  return groups
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Close on outside click (mobile)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const grouped = groupByDate(sessions)
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older']

  function handleDelete(id: string) {
    if (confirmDeleteId === id) {
      onDeleteSession(id)
      setConfirmDeleteId(null)
      setSwipedId(null)
    } else {
      setConfirmDeleteId(id)
      // Auto-reset confirm after 3s
      setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 3000)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay (mobile) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <motion.div
            ref={sidebarRef}
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-16 left-0 bottom-0 w-[280px] max-md:w-[85vw] bg-cosmos border-r border-white/5 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-star text-xs font-semibold tracking-widest uppercase">
                Conversations
              </h3>
              <button
                onClick={onClose}
                className="md:hidden w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Close sidebar"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted" />
                </svg>
              </button>
            </div>

            {/* New Chat button */}
            <div className="px-3 pb-3 pt-1">
              <button
                onClick={() => { onNewChat(); onClose() }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet to-rose text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-violet/20"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                New Chat
              </button>
            </div>

            {/* Divider */}
            <div className="mx-3 border-t border-white/5" />

            {/* Session list */}
            <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <p className="text-muted text-xs">No conversations yet</p>
                  <p className="text-muted/50 text-[10px] mt-1">Start a new chat to begin</p>
                </div>
              ) : (
                groupOrder.map(label => {
                  const group = grouped[label]
                  if (!group || group.length === 0) return null
                  return (
                    <div key={label}>
                      <p className="text-muted text-[10px] uppercase tracking-widest px-3 pt-3 pb-1 select-none">
                        {label}
                      </p>
                      {group.map((session, idx) => {
                        const isActive = session.id === activeSessionId
                        const isSwiped = swipedId === session.id
                        return (
                          <motion.div
                            key={session.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03, duration: 0.2 }}
                            className="relative group"
                          >
                            <div
                              onClick={() => { onSelectSession(session.id); onClose() }}
                              className={`
                                flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150
                                ${isActive
                                  ? 'bg-violet/10 border-l-2 border-violet'
                                  : 'border-l-2 border-transparent hover:bg-violet/5'
                                }
                              `}
                            >
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${isActive ? 'text-star font-medium' : 'text-star/80'}`}>
                                  {session.title}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-muted text-[10px]">
                                    {timeAgo(session.updated_at)}
                                  </span>
                                  {session.message_count && session.message_count > 0 && (
                                    <span className="text-muted/50 text-[10px]">
                                      {session.message_count} msgs
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Delete button — visible on hover (desktop) or tap (mobile) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (isSwiped) {
                                    setSwipedId(null)
                                  } else {
                                    handleDelete(session.id)
                                  }
                                }}
                                className={`
                                  shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer
                                  ${confirmDeleteId === session.id
                                    ? 'bg-red-500/20 text-red-400 opacity-100'
                                    : 'opacity-0 group-hover:opacity-100 hover:bg-white/5 text-muted hover:text-red-400'
                                  }
                                `}
                                aria-label={confirmDeleteId === session.id ? 'Confirm delete' : 'Delete session'}
                                title={confirmDeleteId === session.id ? 'Click again to confirm' : 'Delete'}
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M2 3H10M4.5 3V2C4.5 1.45 4.95 1 5.5 1H6.5C7.05 1 7.5 1.45 7.5 2V3M9 3V10C9 10.55 8.55 11 8 11H4C3.45 11 3 10.55 3 10V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer glow accent */}
            <div className="h-px bg-gradient-to-r from-transparent via-violet/20 to-transparent" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
