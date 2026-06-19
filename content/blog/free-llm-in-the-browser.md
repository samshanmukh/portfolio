---
title: "Running a free LLM in the browser"
date: "2026-06-12"
excerpt: "How to give a static site a real chat model with zero server cost — and the honest trade-offs of on-device inference."
---

You can put a genuinely capable language model on a static site for **$0** — no backend, no API key. The trick is to run it **on the visitor's device** with WebGPU.

## The approach

[WebLLM](https://github.com/mlc-ai/web-llm) loads a quantized model (I use a small Llama / Qwen) straight into the browser and runs inference on the GPU. I wrap it with a tiny bit of RAG over my portfolio data so it answers grounded questions about my work.

```ts
const engine = await CreateMLCEngine(MODEL_ID, {
  initProgressCallback: (p) => setProgress(p.progress),
})
const reply = await engine.chat.completions.create({ messages })
```

## The honest trade-offs

- **First load is heavy** — the weights are a few hundred MB. So I keep it **opt-in**: the default agent is an instant keyword engine; the LLM only downloads if a curious visitor clicks "Smart mode."
- **WebGPU only** — great on desktop Chrome/Edge, spotty on mobile. Graceful fallback matters.
- **Smaller models are clumsier** — fine for Q&A over a known corpus, not a frontier chatbot.

## When to reach for it

If you need *real* quality with no download, a free hosted tier (Groq, Gemini) behind a serverless proxy is better. But if you want something that's truly yours, truly free, and runs with the lights off — on-device is a genuinely fun option.
