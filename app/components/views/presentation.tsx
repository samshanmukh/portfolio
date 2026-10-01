'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { profile, skills } from '../../lib/data'

// "Who are you?" — portrait + intro, like the reference's Presentation card.
export function Presentation() {
  return (
    <div className="mx-auto w-full max-w-5xl py-6">
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="relative h-full w-full"
          >
            <Image
              src={profile.avatar}
              alt={profile.name}
              fill
              sizes="(min-width: 768px) 384px, 100vw"
              className="object-cover object-[50%_20%]"
            />
          </motion.div>
        </div>

        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="bg-gradient-to-r from-foreground to-muted bg-clip-text text-2xl font-semibold text-transparent md:text-3xl">
              {profile.name}
            </h1>
            <div className="mt-1 flex flex-col gap-1 text-muted md:flex-row md:items-center md:gap-4">
              <p>{profile.role}</p>
              <div className="hidden h-1.5 w-1.5 rounded-full bg-border md:block" />
              <p>{profile.location}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 space-y-3 leading-relaxed"
          >
            <p className="font-medium">{profile.headline}</p>
            <p className="text-foreground/80">{profile.bio}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {skills[0].items.slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-full bg-accent px-3 py-1 text-sm">
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
