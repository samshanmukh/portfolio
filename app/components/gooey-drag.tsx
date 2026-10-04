'use client'

import { motion } from 'framer-motion'
import { Liquid } from 'liquid-gooey'
import { useEffect, useRef, useState, type ReactNode } from 'react'

// Makes a round button draggable like the social icons: it can be pulled anywhere, bends like
// liquid while it moves (liquid-gooey's bend effect) and springs back to its spot when let go.
// A drag never counts as a click; a plain click or tap still works as before.
export function GooeyDrag({ radius, children, className = '' }: { radius: number; children: ReactNode; className?: string }) {
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
      className={`goo-row flex ${className}`}
      style={{ zIndex: dragging ? 60 : undefined }} // a dragged button floats above everything else
    >
      <Liquid.Item effect="bend" bend={{ vertical: 0.7, horizontal: 0.5 }} radius={radius}>
        <motion.span
          className="relative flex cursor-grab touch-none active:cursor-grabbing"
          drag
          dragSnapToOrigin
          dragElastic={0.9}
          dragTransition={{ bounceStiffness: 260, bounceDamping: 14 }}
          onPointerDownCapture={() => (dragged.current = false)}
          onDragStart={() => {
            dragged.current = true
            setDragging(true)
          }}
          onDragTransitionEnd={() => setDragging(false)}
          onClickCapture={(e) => {
            if (dragged.current) {
              // it was a drag, not a click
              e.preventDefault()
              e.stopPropagation()
            }
          }}
        >
          {children}
        </motion.span>
      </Liquid.Item>
    </Liquid>
  )
}
