'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Liquid } from 'liquid-gooey'
import { FileText, Mail } from 'lucide-react'
import { useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react'
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
// Each icon can be dragged anywhere; it bends like liquid while it moves (liquid-gooey's bend effect)
// and springs back to its spot when let go. A drag never opens the link; a plain click or tap does.
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
  const dragged = useRef(false)
  const [dragging, setDragging] = useState(false)
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
      blur={5}
      contrast={18}
      fill={dark ? 'rgb(39 39 42)' : 'rgb(255 255 255)'}
      shadow={
        dark
          ? 'inset 0 1px 1px rgb(255 255 255 / 0.14), 0 4px 14px -4px rgb(0 0 0 / 0.6)'
          : 'inset 0 1px 1px rgb(255 255 255 / 0.9), 0 4px 14px -4px rgb(0 0 0 / 0.14), 0 0 0 0.5px rgb(0 0 0 / 0.08)'
      }
      filterPadding={1600}
      className={`goo-row flex items-center gap-2.5 ${className}`}
      style={{ ...style, zIndex: dragging ? 60 : undefined }} // a dragged icon floats above the ask box
    >
      {socialLinks.map(({ label, href, icon: Icon, color }, i) => (
        // entrance pop on the wrapper, drag on the liquid item, hover/press on the link
        // (so hover never inherits the entrance delay)
        <motion.span
          key={label}
          className="flex"
          initial={animate ? { opacity: 0, scale: 0.3, y: 10 } : false}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18, delay: delay + i * 0.08 }}
        >
          <Liquid.Item effect="bend" bend={{ vertical: 0.7, horizontal: 0.5 }} radius={size === 'sm' ? 24 : 28}>
            <motion.span
              className="relative flex cursor-grab touch-none active:cursor-grabbing"
              drag
              dragSnapToOrigin
              dragElastic={0.9}
              dragTransition={{ bounceStiffness: 260, bounceDamping: 14 }}
              whileDrag={{ zIndex: 60 }}
              onDragStart={() => {
                dragged.current = true
                setDragging(true)
              }}
              onDragTransitionEnd={() => setDragging(false)}
            >
              <motion.a
                whileHover={reduced ? undefined : { scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                href={href}
                target={href.startsWith('mailto:') ? undefined : '_blank'}
                rel="noopener noreferrer"
                draggable={false}
                onPointerDown={() => (dragged.current = false)}
                onClick={(e) => {
                  if (dragged.current) e.preventDefault() // it was a drag, not a click
                }}
                aria-label={label}
                title={label}
                className={`glass tap relative flex ${box} items-center justify-center rounded-full`}
              >
                <Icon className={`${icon} ${color}`} />
              </motion.a>
            </motion.span>
          </Liquid.Item>
        </motion.span>
      ))}
    </Liquid>
  )
}
