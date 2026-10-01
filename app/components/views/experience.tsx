'use client'

import { motion } from 'framer-motion'
import { Award, Briefcase, GraduationCap, Languages } from 'lucide-react'
import { certifications, education, experience, languages } from '../../lib/data'

// "Where have you worked?" — timeline.
export function Experience() {
  return (
    <div className="w-full pt-6 pb-4">
      <h2 className="text-3xl font-bold md:text-4xl">Experience</h2>
      <ol className="relative mt-8 space-y-4 border-l border-border pl-6">
        {experience.map((e, i) => (
          <motion.li
            key={e.company + e.period}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.08 * i } }}
            className="relative rounded-2xl bg-accent p-5"
          >
            <span className="absolute top-6 -left-[31px] flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-primary" />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="flex items-center gap-2 font-semibold">
                <Briefcase className="h-4 w-4 text-muted" />
                {e.role} <span className="font-normal text-muted">· {e.company}</span>
              </h3>
              <span className="text-xs text-muted">{e.period}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">{e.note}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}

// "What's your education?" — degrees, certifications, languages.
export function Education() {
  return (
    <div className="w-full pt-6 pb-4">
      <h2 className="text-3xl font-bold md:text-4xl">Education</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {education.map((ed) => (
          <div key={ed.school} className="rounded-2xl bg-accent p-5">
            <GraduationCap className="h-6 w-6 text-primary" />
            <p className="mt-3 font-semibold">{ed.school}</p>
            <p className="text-sm text-muted">{ed.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-border p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <Award className="h-5 w-5 text-[#C19433]" /> Certifications
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm text-foreground/80">
            {certifications.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="text-muted">›</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <Languages className="h-5 w-5 text-[#856ED9]" /> Languages
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {languages.map((l) => (
              <span key={l} className="rounded-full bg-accent px-3 py-1 text-sm">
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
