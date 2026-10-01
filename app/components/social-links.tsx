'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { FileText, Mail } from 'lucide-react'
import type { ComponentType } from 'react'
import { socials } from '../lib/data'
import { GithubIcon, InstagramIcon, LinkedinIcon, XIcon } from './brand-icons'

type Link = { label: string; href: string; icon: ComponentType<{ className?: string }>; color: string }

export const socialLinks: Link[] = [
  { label: 'LinkedIn', href: socials.linkedin, icon: LinkedinIcon, color: 'text-[#0A66C2]' },
  { label: 'GitHub', href: socials.github, icon: GithubIcon, color: 'text-[#181717] dark:text-white' },
  { label: 'X / Twitter', href: socials.twitter, icon: XIcon, color: 'text-black dark:text-white' },
  { label: 'Instagram', href: socials.instagram, icon: InstagramIcon, color: '' },
  { label: 'Email', href: `mailto:${socials.email}`, icon: Mail, color: 'text-[#EA4335]' },
  { label: 'Résumé', href: socials.resume, icon: FileText, color: 'text-[#16A34A]' },
]

// Row of clickable social icons (under the home + chat inputs, contact answer).
// `pop` springs the icons in one after another (static for reduced motion).
export function SocialLinks({
  size = 'md',
  pop = false,
  delay = 0,
  className = '',
}: {
  size?: 'sm' | 'md'
  pop?: boolean
  delay?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  const animate = pop && !reduced
  const box = size === 'sm' ? 'h-10 w-10 md:h-9 md:w-9' : 'h-11 w-11'
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {socialLinks.map(({ label, href, icon: Icon, color }, i) => (
        <motion.a
          key={label}
          initial={animate ? { opacity: 0, scale: 0.3, y: 10 } : false}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18, delay: delay + i * 0.08 }}
          whileHover={reduced ? undefined : { scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.92 }}
          href={href}
          target={href.startsWith('mailto:') ? undefined : '_blank'}
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className={`glass tap relative flex ${box} items-center justify-center rounded-full`}
        >
          <Icon className={`${icon} ${color}`} />
        </motion.a>
      ))}
    </div>
  )
}
