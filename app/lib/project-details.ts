// ---------------------------------------------------------------------------
// Deeper notes on each project for smart mode: the stack and the main features,
// condensed from each repo's README so visitors can ask "what did you use for X"
// or "how does Y work". Keep these short: every line goes into every smart-mode
// question, and Groq's free tier counts tokens per minute. Keyed by project name
// in data.ts.
// ---------------------------------------------------------------------------

export const projectDetails: Record<string, { stack: string; features: string[] }> = {
  CloseSpan: {
    stack:
      'Next.js + TypeScript, PostgreSQL (pgvector-ready), Cloudflare Workers + Queues, Tenki microVM sandboxes, GitHub App, Pipedream Connect, Google sign-in, Docker, Vitest; AI via xAI Grok, OpenAI, Anthropic Claude or OpenRouter (bring-your-own-key, AES-256-GCM encrypted)',
    features: [
      'pulls customer feedback from Slack, Discord, Intercom and Zendesk into one inbox and clusters related reports into product problems with a confidence score',
      'explainable weighted impact score per problem, backed by source evidence',
      'code-aware investigation: hypothesis, suspected files, missing evidence and tests',
      'turns a problem into an engineering ticket with Given/When/Then acceptance criteria',
      'on human approval, an isolated sandbox writes the fix, a second fresh sandbox replays it, and it opens a draft PR with automated review; it never merges or deploys on its own',
      'feature-request voting and public feedback discovery',
    ],
  },
  Zup: {
    stack:
      'native SwiftUI iPhone app; hosted vision models for captions with automatic fallbacks, plus Apple on-device Foundation Models for daily suggestions; Apple Vision; App Attest-signed backend requests; OAuth posting APIs for X, Instagram, Facebook, LinkedIn and TikTok',
    features: [
      'pick photos with the system picker (no full photo-library access) and get a ready-to-post draft with an AI caption',
      'a Voice Profile that learns your tone, length, emoji and hashtag style from what you edit, copy and share',
      'a different caption per platform (X stays under 280 characters; big carousels get longer stories)',
      'direct posting after a final review; more than four X photos post as a thread',
      'an AI photo editor driven by a plain-language prompt, with undo and restore original',
      'the app theme takes its colour from your hero photo, kept readable on-device',
    ],
  },
  'Enterprise Memory Agent': {
    stack: 'Python, FastAPI, Composio, Anthropic Claude (or any OpenAI-compatible model), ChromaDB, SQLite, Streamlit dashboard, pytest (41 tests)',
    features: [
      'one prompt runs five agents: Planner, Research, Critic, Memory and Executor',
      'the Critic scores research 0 to 100 and sends it back for a retry below 70',
      'creates real deliverables in five apps: a Notion report, Linear tasks, a GitHub issue, a Slack summary and a Gmail email',
      'remembers past research across runs (vector + SQL memory) and reuses it on related questions',
    ],
  },
  RepRight: {
    stack: 'Flutter + Dart, Riverpod, Google ML Kit pose detection, Grok API chat, feature-based clean architecture',
    features: [
      'real-time posture correction from the camera while you exercise',
      'live muscle-activation highlighting on screen',
      'scheduled workouts and an AI chat coach for fitness questions',
    ],
  },
  'Vitis-AI Porting Advisor': {
    stack: 'Python, ONNX + PyTorch, ChromaDB RAG (93 operator entries), LangChain, Streamlit, Claude Sonnet via an OpenAI-compatible gateway',
    features: [
      'upload a YOLOv8 .onnx or .pt model and pick one of 12 Xilinx DPU architectures',
      'a four-stage agent pipeline: extract the ops, check each one against the DPU (ok, warning or critical), then two parallel proposals',
      'a conservative port with minimal changes and an aggressive full-INT8 plan with FPS and power estimates',
    ],
  },
  VoiceCoach: {
    stack: 'Flutter + Dart, xAI Grok API, Provider state management, on-device audio recording',
    features: [
      'records short voice clips during a workout and scores posture, fatigue and injury risk from 0 to 100',
      'savage but safety-first coaching in real time, plus session stats',
      'clips are deleted right after analysis',
    ],
  },
  Verdict: {
    stack: 'Python, pandas, NumPy, matplotlib, Binance public market data',
    features: [
      'no lookahead: a signal on one candle trades on the next',
      'fees and slippage charged on every position change',
      '70/30 in-sample and out-of-sample split to catch overfitting, with a buy-and-hold benchmark to beat',
      'SMA crossover, RSI mean-reversion and Donchian breakout strategies, with win rate, max drawdown and Sharpe',
    ],
  },
  'Creative Swarm AI': {
    stack: 'Next.js App Router, TypeScript, Tailwind, OpenAI (gpt-4o-mini), Akamai Cloud (Linode) routing, Magnific adapter',
    features: [
      'turns a product description into a full campaign using nine specialist agents',
      'Trend and Research agents run in parallel, feed a Strategy agent, which fans out to US, EU and APAC agents on regional edges',
      'visual prompts go through Magnific, a Critic agent reviews the result, and every agent step is traced',
    ],
  },
}
