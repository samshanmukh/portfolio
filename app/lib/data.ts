// ---------------------------------------------------------------------------
// Single source of truth for site content. Edit here — components read from it.
// Sourced from GitHub (github.com/samshanmukh) + LinkedIn profile export.
// ---------------------------------------------------------------------------

export const profile = {
  name: 'Sanmukh (Sam) Karri',
  shortName: 'Sam',
  role: 'Machine Learning & AI Engineer',
  location: 'San Francisco, CA',
  avatar: '/avatar.jpg', // color portrait, used large in the hero
  logo: 'https://avatars.githubusercontent.com/u/25922277?v=4', // illustration, used for nav + favicon
  headline:
    'I turn messy data into AI that ships — production ML pipelines, computer vision, and GenAI/RAG systems.',
  bio: `I'm an ML/AI engineer and data scientist with 6+ years taking models out of notebooks and into production — recommendation engines, healthcare computer-vision pipelines, and RAG chatbots that real users depend on. Lately I'm deep in LLM agents and generative AI. Outside work you'll find me in the gym, which is exactly why half my side projects are AI coaches.`,
  available: true,
  // Edit to taste (add work-authorization status if you want recruiters to know).
  lookingFor: 'Open to ML / AI Engineer roles · San Francisco or remote',
}

// Real LinkedIn recommendations (lightly trimmed). Source: LinkedIn export.
export const testimonials = [
  {
    quote:
      "A fast learner who isn't afraid to step outside his comfort zone — he regularly raised helpful points and asked the right “why” questions. He'll be an asset to any organization looking for a bright data scientist.",
    name: 'Yoed Nehoran',
    title: 'CEO, QQ Tech',
  },
  {
    quote:
      "An incredible asset to the dev team. I can always count on him to roll up his sleeves — whether it's debugging or development, he's accountable to the project and his team. A joy to work with.",
    name: 'Hiruni Wijayaratne',
    title: 'Senior Manager, Omada Health',
  },
  {
    quote:
      'Dedicated and passionate, always up for challenges and quick to learn. We worked together on a health & fitness project providing automated coach training.',
    name: 'Saiprasad Gupta',
    title: 'Senior Software Engineer, ixigo',
  },
]

// Deployed site URL (used for SEO, sitemap, OG, JSON-LD).
export const siteUrl = 'https://samkarri.com'

export const socials = {
  email: 'shanmukhsain@gmail.com',
  github: 'https://github.com/samshanmukh',
  linkedin: 'https://www.linkedin.com/in/shanmukhsain',
  twitter: 'https://x.com/samshanmukh',
  instagram: 'https://www.instagram.com/samshanmukh',
  // phones: the availability badge opens Messages with this prefilled; `?&body=` works on iOS and Android
  sms: 'sms:+13322546972?&body=Hey!',
  // Put your PDF at /public/resume.pdf and this just works. Or swap in any URL.
  resume: '/resume.pdf',
  // Public source — proof the site is hand-coded from scratch.
  sourceRepo: 'https://github.com/samshanmukh/portfolio',
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
  metric?: string // quantified impact, e.g. "cut hallucinations ~40% on a 10k-doc store"
  demo?: string // live demo / video URL
}

// Real repositories — github.com/samshanmukh
// Ordered to lead with the most substantial engineering, then the memorable
// gym-AI work, then experiments.
export const projects: Project[] = [
  {
    name: 'Enterprise Memory Agent',
    blurb:
      'A multi-agent enterprise research assistant with persistent memory and autonomous cross-app execution, built on Composio.',
    tags: ['Multi-agent', 'Composio', 'Python'],
    href: 'https://github.com/samshanmukh/enterprise-memory-execution-agent',
    featured: true,
  },
  {
    name: 'RepRight',
    blurb:
      'An AI personal trainer that watches your form in real time — corrects technique and highlights which muscles you’re activating live on screen.',
    tags: ['Computer Vision', 'Flutter', 'Pose Estimation'],
    href: 'https://github.com/samshanmukh/RepRight',
    featured: true,
  },
  {
    name: 'Vitis-AI Porting Advisor',
    blurb:
      'Scans a model for DPU compatibility and generates two AI-powered refactoring proposals to get it hardware-ready.',
    tags: ['Edge AI', 'Python', 'Tooling'],
    href: 'https://github.com/samshanmukh/Vitis-AI-Porting-Advisor',
    featured: true,
  },
  {
    name: 'VoiceCoach',
    blurb:
      'An AI trainer that reads posture, fatigue, and injury risk from your voice alone — no camera, no wearables. Powered by Grok / the xAI API.',
    tags: ['LLM', 'xAI / Grok', 'Audio'],
    href: 'https://github.com/samshanmukh/voicecoach-grok',
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
  tagline: 'Away from the keyboard',
  blurb:
    "I lift. A lot. The gym is where I problem-solve away from a screen — and it's the reason half my side projects are AI coaches. Form checks, progressive overload, and the occasional ego lift.",
  // Fun, editable stats — tweak to taste.
  stats: [
    { label: 'Favorite lift', value: 'Deadlift' },
    { label: 'Training', value: '5×/week' },
    { label: 'Built for it', value: 'RepRight + VoiceCoach' },
  ],
}
