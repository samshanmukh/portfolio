'use client'

import { motion } from 'framer-motion'
import { Code2, Globe, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { profile, skills, socials } from '../../lib/data'

// "What are you looking for?" — availability card (the reference's internship card).
export function Status({ onAsk }: { onAsk: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto mt-6 w-full max-w-4xl rounded-3xl bg-accent px-6 py-8 sm:px-10 md:px-14 md:py-12"
    >
      <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full shadow-md">
            <Image src={profile.avatar} alt={profile.name} fill sizes="64px" className="object-cover object-[50%_18%]" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{profile.name}</h2>
            <p className="text-sm text-muted">{profile.role}</p>
          </div>
        </div>
        {profile.available && (
          <span className="flex items-center gap-1.5 rounded-full border border-green-500 px-3 py-0.5 text-sm font-medium text-green-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Available
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-5 w-5 text-blue-500" />
          <div>
            <p className="text-sm font-medium">Looking for</p>
            <p className="text-sm text-muted">{profile.lookingFor}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Globe className="mt-1 h-5 w-5 text-green-500" />
          <div>
            <p className="text-sm font-medium">Location</p>
            <p className="text-sm text-muted">{profile.location}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 sm:col-span-2">
          <Code2 className="mt-1 h-5 w-5 text-purple-500" />
          <div className="w-full">
            <p className="text-sm font-medium">Tech stack</p>
            <p className="text-sm text-muted">
              {skills.map((s) => s.items.slice(0, 4).join(', ')).join(' · ')}{' '}
              <button onClick={() => onAsk("What's your stack?")} className="tap relative cursor-pointer text-primary underline">
                See more
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <p className="mb-2 text-lg font-semibold">What I bring</p>
        <p className="text-sm text-foreground/85">{profile.headline}</p>
      </div>

      <div className="mt-10 flex justify-center">
        <a
          href={`mailto:${socials.email}`}
          className="glass rounded-full px-6 py-3 font-semibold"
        >
          Contact me
        </a>
      </div>
    </motion.div>
  )
}
