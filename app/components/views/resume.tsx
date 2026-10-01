'use client'

import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { profile, socials } from '../../lib/data'

// "Can I see your résumé?" — download card.
export function Resume() {
  return (
    <div className="mx-auto w-full py-8">
      <motion.a
        href={socials.resume}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className="group block overflow-hidden rounded-xl bg-accent p-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium">{profile.shortName}&apos;s Résumé</h3>
            <p className="text-sm text-muted">{profile.role}</p>
            <div className="mt-1 flex text-xs text-muted">
              <span>PDF</span>
              <span className="mx-2">•</span>
              <span>{profile.location}</span>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background group-hover:opacity-80">
            <Download className="h-5 w-5" />
          </div>
        </div>
      </motion.a>
    </div>
  )
}
