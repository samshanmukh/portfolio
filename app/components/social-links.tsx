'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Liquid } from 'liquid-gooey'
import { FileText, Mail } from 'lucide-react'
import { useEffect, useState, type ComponentType, type CSSProperties } from 'react'
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
  style,
}: {
  size?: 'sm' | 'md'
  pop?: boolean
  delay?: number
  className?: string
  style?: CSSProperties
}) {
  const reduced = useReducedMotion()
  const animate = pop && !reduced
  const box = size === 'sm' ? 'h-12 w-12' : 'h-14 w-14'
  const icon = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'
  const step = (size === 'sm' ? 48 : 56) + 10 // button + gap-2.5
  // launch: the icons start as one liquid blob in the middle, then melt apart into their row
  const [split, setSplit] = useState(!animate)
  useEffect(() => {
    if (!animate) return
    const t = setTimeout(() => setSplit(true), delay * 1000 + 120)
    return () => clearTimeout(t)
  }, [animate, delay])
  const mid = (socialLinks.length - 1) / 2
  const [hovered, setHovered] = useState<number | null>(null)
  // the liquid's colour and shadow are parsed by the library, so follow the theme here
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const html = document.documentElement
    const read = () => setDark(html.classList.contains('dark'))
    read()
    const mo = new MutationObserver(read)
    mo.observe(html, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])
  return (
    <Liquid
      blur={5.5}
      contrast={18}
      fill={dark ? 'rgb(39 39 42)' : 'rgb(255 255 255)'}
      shadow={
        dark
          ? 'inset 0 1px 1px rgb(255 255 255 / 0.14), 0 4px 14px -4px rgb(0 0 0 / 0.6)'
          : 'inset 0 1px 1px rgb(255 255 255 / 0.9), 0 4px 14px -4px rgb(0 0 0 / 0.14), 0 0 0 0.5px rgb(0 0 0 / 0.08)'
      }
      className={`goo-row flex items-center gap-2.5 ${className}`}
      style={style}
    >
      {socialLinks.map(({ label, href, icon: Icon, color }, i) => (
        <Liquid.Item
          key={label}
          x={split ? 0 : (mid - i) * step}
          scale={!split ? 0.7 : hovered === i ? 1.2 : 1}
          transition="bouncy"
          delay={split && hovered === null ? Math.abs(i - mid) * 50 : 0}
        >
          {/* hover grows the drop so it bridges to its neighbours; the icon fades in as its drop breaks away */}
          <motion.a
            onPointerEnter={(e) => !reduced && e.pointerType === 'mouse' && setHovered(i)}
            onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            href={href}
            target={href.startsWith('mailto:') ? undefined : '_blank'}
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className={`glass tap relative flex ${box} items-center justify-center rounded-full`}
          >
            <motion.span
              className="flex"
              initial={animate ? { opacity: 0, scale: 0.4 } : false}
              animate={split ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18, delay: split ? 0.12 + Math.abs(i - mid) * 0.05 : 0 }}
            >
              <Icon className={`${icon} ${color}`} />
            </motion.span>
          </motion.a>
        </Liquid.Item>
      ))}
    </Liquid>
  )
}
