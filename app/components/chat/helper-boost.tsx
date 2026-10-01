'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  BriefcaseIcon,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleEllipsis,
  CodeIcon,
  GraduationCapIcon,
  MailIcon,
  PartyPopper,
  Sparkles,
  UserSearch,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { questionsByCategory, quickConfig, quickQuestions, specialQuestions } from '../../lib/questions'
import { quickIcons } from '../quick-icons'

const categoryIcons: Record<string, typeof UserSearch> = {
  me: UserSearch,
  professional: BriefcaseIcon,
  projects: CodeIcon,
  skills: GraduationCapIcon,
  fun: PartyPopper,
  contact: MailIcon,
}

// Quick-question row above the chat input, plus the "more questions" bottom sheet.
export function HelperBoost({ onAsk, disabled }: { onAsk: (q: string) => void; disabled?: boolean }) {
  const [visible, setVisible] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const ask = (q: string) => {
    setOpen(false)
    onAsk(q)
  }

  return (
    <div className="w-full">
      <div className={`flex justify-center ${visible ? 'mb-2' : ''}`}>
        <button
          onClick={() => setVisible((v) => !v)}
          className="flex cursor-pointer items-center gap-1 px-3 py-1 text-xs text-muted transition-colors hover:text-foreground"
        >
          {visible ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {visible ? 'Hide quick questions' : 'Show quick questions'}
        </button>
      </div>

      {visible && (
        <div className="flex w-full flex-wrap gap-1 md:gap-3" style={{ justifyContent: 'safe center' }}>
          {quickConfig.map(({ key, color }) => {
            const Icon = quickIcons[key]
            return (
              <button
                key={key}
                disabled={disabled}
                onClick={() => onAsk(quickQuestions[key])}
                className="h-auto min-w-[88px] shrink-0 cursor-pointer rounded-xl border border-neutral-300 bg-white/80 px-3 py-2.5 backdrop-blur-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-neutral-100 md:min-w-[100px] md:px-4 md:py-3 dark:border-neutral-700 dark:bg-neutral-800/80 dark:hover:bg-neutral-700"
              >
                <span className="flex items-center justify-center gap-2 md:gap-3">
                  <Icon size={18} strokeWidth={2} color={color} />
                  <span className="text-sm font-medium">{key}</span>
                </span>
              </button>
            )
          })}
          <button
            onClick={() => setOpen(true)}
            aria-label="More questions"
            className="flex shrink-0 cursor-pointer items-center rounded-xl border border-neutral-300 bg-white/80 px-3 py-2.5 backdrop-blur-sm transition-colors hover:bg-neutral-100 md:px-4 md:py-3 dark:border-neutral-700 dark:bg-neutral-800/80 dark:hover:bg-neutral-700"
          >
            <CircleEllipsis className="h-5 w-[18px]" strokeWidth={2} />
          </button>
        </div>
      )}

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="More questions"
                  className="fixed inset-x-0 bottom-0 z-[100] flex h-[80%] flex-col rounded-t-[10px] bg-background lg:h-[60%]"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.6 }}
                  onDragEnd={(_, info) => info.offset.y > 120 && setOpen(false)}
                >
                  <div className="flex-1 overflow-y-auto rounded-t-[10px] p-4">
                    <div className="mx-auto max-w-md">
                      <div aria-hidden className="mx-auto mb-8 h-1.5 w-12 rounded-full bg-accent" />
                      <div className="space-y-8 pb-16">
                        {questionsByCategory.map((c) => {
                          const Icon = categoryIcons[c.id] ?? UserSearch
                          return (
                            <div key={c.id} className="space-y-3">
                              <div className="flex items-center gap-2.5 px-1">
                                <Icon className="h-5 w-5 text-foreground/70" />
                                <h3 className="text-[22px] font-medium">{c.name}</h3>
                              </div>
                              <div className="my-4 h-px w-full bg-border" />
                              <div className="space-y-3">
                                {c.questions.map((q) => (
                                  <QuestionItem
                                    key={q}
                                    question={q}
                                    special={specialQuestions.includes(q)}
                                    onClick={() => ask(q)}
                                  />
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}

function QuestionItem({ question, special, onClick }: { question: string; special: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`group flex w-full cursor-pointer items-center justify-between rounded-[10px] px-6 py-4 text-left transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        special
          ? 'bg-black font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200'
          : 'bg-accent hover:bg-neutral-200 dark:hover:bg-neutral-700'
      }`}
    >
      <span className="flex items-center">
        {special && <Sparkles className="mr-2 h-4 w-4" />}
        {question}
      </span>
      <ChevronRight
        className={`h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1 ${special ? '' : 'text-primary'}`}
      />
    </motion.button>
  )
}
