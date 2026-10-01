'use client'

import { motion } from 'framer-motion'
import { Award, Code, Mail, MessageSquare } from 'lucide-react'
import { profile } from '../../lib/data'

const suggestions = [
  { icon: MessageSquare, text: 'Who are you?' },
  { icon: Code, text: 'What have you built?' },
  { icon: Award, text: "What's your stack?" },
  { icon: Mail, text: 'How can I reach you?' },
]

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

// Empty chat state.
export function ChatLanding({ onAsk }: { onAsk: (q: string) => void }) {
  return (
    <motion.div className="flex w-full flex-col items-center px-4 py-6" initial="hidden" animate="visible" variants={container}>
      <motion.div className="mb-8 text-center" variants={item}>
        <h2 className="mb-3 text-2xl font-semibold">I&apos;m {profile.shortName}&apos;s digital twin</h2>
        <p className="mx-auto max-w-md text-muted">
          ML/AI engineer — ask me anything. Fair warning: I run on sarcasm, dad jokes, and unpopular opinions (tabs &gt; spaces).
        </p>
      </motion.div>
      <motion.div className="w-full max-w-md space-y-3" variants={container}>
        {suggestions.map(({ icon: Icon, text }) => (
          <motion.button
            key={text}
            onClick={() => onAsk(text)}
            variants={item}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full cursor-pointer items-center rounded-lg bg-accent px-4 py-3 transition-colors hover:bg-accent/80"
          >
            <span className="mr-3 rounded-full bg-background p-2">
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-left">{text}</span>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  )
}
