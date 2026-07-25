// ---------------------------------------------------------------------------
// Single source of truth for site content. Edit here — components read from it.
// Sourced from GitHub (github.com/samshanmukh) + LinkedIn profile export.
// ---------------------------------------------------------------------------

export const profile = {
  name: 'Sam Karri',
  shortName: 'Sam',
  role: 'Forward Deployed Engineer (FDE)',
  location: 'San Francisco, CA',
  avatar: '/avatar.jpg', // color portrait, used large in the hero
  logo: 'https://avatars.githubusercontent.com/u/25922277?v=4', // illustration, used for nav + favicon
  headline:
    'I embed with teams and ship AI from messy real-world data to production — LLM agents, RAG systems, and computer-vision pipelines people actually depend on.',
  bio: `I'm a forward deployed engineer — I go where the problem is, embed with the team, and turn ambiguous real-world requirements into AI that ships. Six-plus years taking models out of notebooks and into production: healthcare computer-vision pipelines, RAG chatbots, and recommendation engines that real users depend on. I own the whole loop — messy data, model, deployment, and the iteration after launch. Lately I'm deep in LLM agents and generative AI. Outside work you'll find me in the gym, which is exactly why half my side projects are AI coaches.`,
  available: true,
  // Edit to taste (add work-authorization status if you want recruiters to know).
  lookingFor: 'Open to Forward Deployed Engineer / AI Engineer roles · San Francisco or remote',
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
  // Case-study narrative for featured work (qualitative — no invented numbers).
  problem?: string // the real-world pain
  move?: string // what I actually built / shipped
  outcome?: string // what changed once it was deployed
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
    problem:
      'Enterprise knowledge is scattered across apps, and assistants forget everything the moment a session ends.',
    move:
      'Built a multi-agent researcher with persistent memory that plans and executes across apps autonomously, on Composio.',
    outcome:
      'An agent that remembers context and acts across your stack — instead of starting cold on every question.',
  },
  {
    name: 'RepRight',
    blurb:
      'An AI personal trainer that watches your form in real time — corrects technique and highlights which muscles you’re activating live on screen.',
    tags: ['Computer Vision', 'Flutter', 'Pose Estimation'],
    href: 'https://github.com/samshanmukh/RepRight',
    featured: true,
    problem:
      'Good lifting form falls apart the moment no coach is watching — and that is when people get hurt.',
    move:
      'Shipped a real-time pose-estimation trainer that runs on a phone and reads your body live, no wearables.',
    outcome:
      'On-device form correction with live muscle-activation cues — a coach in your pocket. (It powers the live demo below.)',
  },
  {
    name: 'Vitis-AI Porting Advisor',
    blurb:
      'Scans a model for DPU compatibility and generates two AI-powered refactoring proposals to get it hardware-ready.',
    tags: ['Edge AI', 'Python', 'Tooling'],
    href: 'https://github.com/samshanmukh/Vitis-AI-Porting-Advisor',
    featured: true,
    problem:
      'Getting a model onto edge DPU hardware is slow, manual, and easy to get subtly wrong.',
    move:
      'Built a tool that scans a model for DPU compatibility and drafts two AI-generated refactoring proposals.',
    outcome:
      'From “will this even run on the hardware?” to concrete, hardware-ready refactors to choose between.',
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
    note: 'Embedded with a healthcare team to put ML in production — RAG over vector DBs with GenAI foundation models for accurate retrieval, plus computer-vision pipelines (segmentation, detection, anomaly detection) on CNN / transfer-learning architectures.',
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
    note: 'Took a personalized recommendation engine (clustering + collaborative filtering) and customer-segmentation models from prototype to production on a Hadoop / Spark stack.',
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
