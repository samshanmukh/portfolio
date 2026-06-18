// ---------------------------------------------------------------------------
// Single source of truth for site content. Edit here — components read from it.
// Sourced from GitHub (github.com/samshanmukh) + LinkedIn profile export.
// ---------------------------------------------------------------------------

export const profile = {
  name: 'Sanmukh (Sam) Karri',
  shortName: 'Sam',
  role: 'Machine Learning & AI Engineer',
  location: 'San Francisco, CA',
  avatar: 'https://avatars.githubusercontent.com/u/25922277?v=4',
  headline:
    'I turn messy data into AI that ships — production ML pipelines, computer vision, and GenAI/RAG systems.',
  bio: `I'm an ML/AI engineer and data scientist with 8+ years taking models out of notebooks and into production — recommendation engines, healthcare computer-vision pipelines, and RAG chatbots that real users depend on. Lately I'm deep in LLM agents and generative AI. Outside work you'll find me in the gym, which is exactly why half my side projects are AI coaches.`,
  available: true,
}

export const socials = {
  email: 'shanmukhsain@gmail.com',
  github: 'https://github.com/samshanmukh',
  linkedin: 'https://www.linkedin.com/in/shanmukhsain',
  twitter: 'https://x.com/samshanmukh',
  // Put your PDF at /public/resume.pdf and this just works. Or swap in any URL.
  resume: '/resume.pdf',
}

export const skills: { group: string; items: string[] }[] = [
  {
    group: 'AI / ML',
    items: [
      'Machine Learning',
      'Deep Learning',
      'Computer Vision',
      'Generative AI',
      'LLM Agents',
      'RAG',
      'CNN / RNN / GANs',
      'NLP',
      'MLOps',
    ],
  },
  {
    group: 'Data & Big Data',
    items: [
      'Python',
      'R',
      'SQL',
      'PySpark',
      'Spark / Hadoop',
      'Databricks',
      'Snowflake',
      'Neo4j',
      'pandas',
      'TensorFlow',
      'Scikit-Learn',
    ],
  },
  {
    group: 'Build & Cloud',
    items: [
      'AWS · Azure · GCP',
      'Node.js',
      'React.js',
      'Flutter',
      'OpenCV',
      'Docker',
      'Git',
      'ETL',
    ],
  },
]

export type Project = {
  name: string
  blurb: string
  tags: string[]
  href: string
  featured?: boolean
}

// Real repositories — github.com/samshanmukh
export const projects: Project[] = [
  {
    name: 'RepRight',
    blurb:
      'An AI personal trainer that watches your form in real time — corrects technique and highlights which muscles you’re activating live on screen.',
    tags: ['Computer Vision', 'Flutter', 'Pose Estimation'],
    href: 'https://github.com/samshanmukh/RepRight',
    featured: true,
  },
  {
    name: 'VoiceCoach',
    blurb:
      'The first AI trainer that reads posture, fatigue, and injury risk from your voice alone — no camera, no wearables. Powered by Grok / the xAI API.',
    tags: ['LLM', 'xAI / Grok', 'Audio'],
    href: 'https://github.com/samshanmukh/voicecoach-grok',
    featured: true,
  },
  {
    name: 'Enterprise Memory Agent',
    blurb:
      'A multi-agent enterprise research assistant with persistent memory and autonomous cross-app execution, built on Composio.',
    tags: ['Multi-agent', 'Composio', 'Python'],
    href: 'https://github.com/samshanmukh/enterprise-memory-execution-agent',
    featured: true,
  },
  {
    name: 'Vitis-AI Porting Advisor',
    blurb:
      'Scans a model for DPU compatibility and generates two AI-powered refactoring proposals to get it hardware-ready.',
    tags: ['Edge AI', 'Python', 'Tooling'],
    href: 'https://github.com/samshanmukh/Vitis-AI-Porting-Advisor',
  },
  {
    name: 'Verdict',
    blurb:
      'A backtester that kills bad trading strategies before they cost you money — real data, real costs, out-of-sample splits that catch overfitting.',
    tags: ['Quant', 'Python', 'Backtesting'],
    href: 'https://github.com/samshanmukh/Verdict',
  },
  {
    name: 'Creative Swarm AI',
    blurb:
      'A distributed AI creative-campaign generator that coordinates a swarm of agents across Akamai + Magnific.',
    tags: ['Agents', 'TypeScript', 'GenAI'],
    href: 'https://github.com/samshanmukh/Creative-Swarm-AI',
  },
]

export const experience = [
  {
    role: 'Data Scientist',
    company: 'CLINICOM',
    period: 'Feb 2024 — May 2026',
    note: 'Built and deployed ML pipelines for healthcare chatbots — RAG with GenAI foundation models + vector DBs for accurate retrieval, plus computer-vision pipelines (segmentation, detection, anomaly detection) on CNN/transfer-learning architectures.',
  },
  {
    role: 'Data Science Intern',
    company: 'QQ Tech, Inc.',
    period: 'Jun 2023 — Dec 2023',
    note: 'Shipped ML/DL models end-to-end, optimized graph algorithms in embedding spaces for pattern recognition, and built NLP analysis of legal documents on Spark / Databricks / Snowflake.',
  },
  {
    role: 'Senior Software Development Engineer',
    company: 'Focus-N-Fly',
    period: 'Jan 2020 — May 2023',
    note: 'Designed a personalized recommendation engine (clustering + collaborative filtering) and customer-segmentation models on a Hadoop/Spark stack, from prototype to production.',
  },
  {
    role: 'Software Engineer',
    company: 'Navtech',
    period: 'Dec 2018 — Dec 2019',
    note: 'Built and maintained ETL pipelines in Python/SQL over distributed Hadoop/Spark, with data-quality checks and ML support for predictive analytics.',
  },
  {
    role: 'Software Developer & Data Analyst',
    company: 'Prahem Technologies',
    period: 'May 2017 — Nov 2018',
    note: 'Built scalable data-processing pipelines and interactive Tableau / Matplotlib dashboards; implemented early predictive models (regression, decision trees).',
  },
]

export const education = [
  {
    school: 'University of the Pacific',
    detail: 'M.S. in Data Science · 2022 — 2024',
  },
  {
    school: 'Jawaharlal Nehru Technological University',
    detail: 'B.Tech · 2015 — 2019',
  },
]

// AI-relevant certifications (LinkedIn export)
export const certifications = [
  'Introduction to Generative AI — Google Cloud',
  'Attention Mechanism — Google Cloud',
  'Encoder-Decoder Architecture — Google Cloud',
  'Machine Learning with Python — Coursera',
  'Python Essentials for MLOps — Coursera',
]

export const languages = ['English', 'Hindi', 'Spanish']

export const gym = {
  tagline: 'Outside the terminal',
  blurb:
    "I lift. A lot. The gym is where I problem-solve away from a screen — and it's the reason half my side projects are AI coaches. Form checks, progressive overload, and the occasional ego lift.",
  // Fun, editable stats — tweak to taste.
  stats: [
    { label: 'Favorite lift', value: 'Deadlift' },
    { label: 'Training', value: '5×/week' },
    { label: 'Built for it', value: 'RepRight + VoiceCoach' },
  ],
}
