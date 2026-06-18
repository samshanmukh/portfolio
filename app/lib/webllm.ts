// ---------------------------------------------------------------------------
// Lazy loader for an in-browser LLM (WebLLM / WebGPU). The heavy library and
// model weights are only fetched when a visitor opts into "Smart mode".
// ---------------------------------------------------------------------------

// Small instruct model chosen for a FAST first download (~0.4 GB quantized,
// cached after first load). Swap to 'Llama-3.2-1B-Instruct-q4f16_1-MLC' for
// better quality at ~0.9 GB, or 'Llama-3.2-3B-Instruct-q4f16_1-MLC' (~1.9 GB).
export const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'
export const MODEL_LABEL = 'qwen2.5-0.5b · local'

export type Progress = { progress: number; text: string }

// `any` to avoid pulling WebLLM types into the SSR/server bundle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let enginePromise: Promise<any> | null = null

export function webgpuSupported(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEngine(onProgress?: (p: Progress) => void): Promise<any> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const webllm = await import('@mlc-ai/web-llm')
      return webllm.CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (r: { progress: number; text: string }) =>
          onProgress?.({ progress: r.progress, text: r.text }),
      })
    })().catch((err) => {
      enginePromise = null // allow retry on failure
      throw err
    })
  }
  return enginePromise
}

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }

// Streams the assistant reply token-by-token via onToken; resolves with the full text.
export async function chatStream(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  engine: any,
  messages: ChatMsg[],
  onToken: (full: string) => void
): Promise<string> {
  const chunks = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.4,
    max_tokens: 320,
  })
  let full = ''
  for await (const chunk of chunks) {
    const delta = chunk.choices?.[0]?.delta?.content ?? ''
    if (delta) {
      full += delta
      onToken(full)
    }
  }
  return full
}
