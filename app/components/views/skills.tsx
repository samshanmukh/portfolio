'use client'

import { motion } from 'framer-motion'
import { Cloud, Cpu, Database } from 'lucide-react'
import { skills } from '../../lib/data'
import { SkillLogo } from '../skill-logo'

const icons = [Cpu, Database, Cloud]

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.19, 1, 0.22, 1] as const } },
}
const badge = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }

// "What are your skills?" — grouped badges.
export function Skills() {
  return (
    <motion.div
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
      className="mx-auto w-full max-w-5xl pt-6 pb-8"
    >
      <h2 className="text-3xl font-bold md:text-4xl">Skills &amp; Expertise</h2>
      <motion.div className="mt-6 space-y-8" variants={container} initial="hidden" animate="visible">
        {skills.map((s, i) => {
          const Icon = icons[i % icons.length]
          return (
            <motion.div key={s.group} className="space-y-3" variants={item}>
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                <h3 className="text-lg font-semibold">{s.group}</h3>
              </div>
              <motion.div className="flex flex-wrap gap-2" variants={container}>
                {s.items.map((skill) => (
                  <motion.span
                    key={skill}
                    variants={badge}
                    whileHover={{ scale: 1.04 }}
                    className="glass flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-foreground"
                  >
                    <SkillLogo skill={skill} />
                    {skill}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
