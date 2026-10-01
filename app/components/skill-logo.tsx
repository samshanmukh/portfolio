import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  Brain,
  Database,
  FileSearch,
  Infinity as InfinityIcon,
  Layers,
  MessageSquareText,
  Network,
  ScanEye,
  Sparkles,
  Workflow,
} from 'lucide-react'
import {
  siApachehadoop,
  siApachespark,
  siDatabricks,
  siDocker,
  siFlutter,
  siGit,
  siGooglecloud,
  siNeo4j,
  siNodedotjs,
  siOpencv,
  siPandas,
  siPython,
  siR,
  siReact,
  siScikitlearn,
  siSnowflake,
  siTensorflow,
} from 'simple-icons'
import { siAws, siAzure } from '../lib/legacy-icons'

type Brand = { title: string; hex: string; path: string }

// Product skills get their brand logos (several for combined badges); concepts get a
// matching monochrome icon. Anything unlisted renders without an icon.
const brands: Record<string, Brand[]> = {
  Python: [siPython],
  R: [siR],
  PySpark: [siApachespark],
  'Spark / Hadoop': [siApachespark, siApachehadoop],
  Databricks: [siDatabricks],
  Snowflake: [siSnowflake],
  Neo4j: [siNeo4j],
  pandas: [siPandas],
  TensorFlow: [siTensorflow],
  'Scikit-Learn': [siScikitlearn],
  'AWS · Azure · GCP': [siAws, siAzure, siGooglecloud],
  'Node.js': [siNodedotjs],
  'React.js': [siReact],
  Flutter: [siFlutter],
  OpenCV: [siOpencv],
  Docker: [siDocker],
  Git: [siGit],
}

const concepts: Record<string, LucideIcon> = {
  'Machine Learning': Brain,
  'Deep Learning': Layers,
  'Computer Vision': ScanEye,
  'Generative AI': Sparkles,
  'LLM Agents': Bot,
  RAG: FileSearch,
  'CNN / RNN / GANs': Network,
  NLP: MessageSquareText,
  MLOps: InfinityIcon,
  SQL: Database,
  ETL: Workflow,
}

const channels = (hex: string) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
const luminance = (hex: string) => {
  const [r, g, b] = channels(hex).map((c) => c / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Very pale brand colours (Hadoop, React…) wash out on light glass: darken them a bit.
function lightModeColor(hex: string) {
  if (luminance(hex) < 0.6) return `#${hex}`
  return `rgb(${channels(hex).map((c) => Math.round(c * 0.7)).join(' ')})`
}

// Very dark brand colours (AWS navy, pandas, Flutter…) vanish on dark glass: use a light tint.
const darkModeColor = (hex: string) => (luminance(hex) < 0.3 ? '#e5e7eb' : `#${hex}`)

export function SkillLogo({ skill, className = 'h-4 w-4' }: { skill: string; className?: string }) {
  const logos = brands[skill]
  if (logos) {
    return (
      <span className="flex items-center gap-1">
        {logos.map((l) => (
          <svg
            key={l.title}
            role="img"
            aria-label={l.title}
            viewBox="0 0 24 24"
            className={`${className} shrink-0 fill-[var(--brand)] dark:fill-[var(--brand-dark)]`}
            style={{ '--brand': lightModeColor(l.hex), '--brand-dark': darkModeColor(l.hex) } as React.CSSProperties}
          >
            <path d={l.path} />
          </svg>
        ))}
      </span>
    )
  }
  const Icon = concepts[skill]
  return Icon ? <Icon className={`${className} shrink-0 text-muted`} aria-hidden /> : null
}
