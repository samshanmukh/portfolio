import type { AvatarConfig } from '../components/avatar3d/scene'

// Wraps the compiled avatar runtime (public/avatar-runtime.js) and a config into one
// self-contained HTML page. three.js comes from a CDN through an import map; nothing
// else is needed, so the file runs by double-clicking it or dropping it on any host.
export async function buildAvatarHtml(config: AvatarConfig) {
  const res = await fetch('/avatar-runtime.js')
  if (!res.ok) throw new Error(`couldn't load the avatar runtime (${res.status})`)
  const runtime = (await res.text()).replace(/^export /gm, '')
  const version = runtime.match(/three-version: ([\d.]+)/)?.[1] ?? '0.186.1'
  const cdn = `https://cdn.jsdelivr.net/npm/three@${version}`
  const importMap = JSON.stringify({ imports: { three: `${cdn}/build/three.module.js`, 'three/examples/jsm/': `${cdn}/examples/jsm/` } })
  const cfg = JSON.stringify(config).replace(/</g, '\\u003c')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>My 3D avatar</title>
<style>
  html, body { margin: 0; height: 100%; background: #f5f5f7; color: #111; font-family: system-ui, -apple-system, sans-serif; }
  @media (prefers-color-scheme: dark) { html, body { background: #111113; color: #eee; } input { background: #1d1d20 !important; border-color: #333 !important; color: #eee; } }
  main { min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; padding: 16px; box-sizing: border-box; }
  #stage { width: min(80vw, 55vh, 420px); aspect-ratio: 1; }
  canvas { width: 100%; height: 100%; display: block; }
  input { width: min(100%, 440px); box-sizing: border-box; font: inherit; font-size: 16px; padding: 14px 22px; border-radius: 999px; border: 1px solid #d4d4d8; background: #fff; outline: none; }
  footer { font-size: 12px; opacity: 0.55; }
  footer a { color: inherit; }
</style>
<script type="importmap">${importMap}</script>
</head>
<body>
<main>
  <div id="stage" role="img" aria-label="Live 3D avatar"><canvas></canvas></div>
  <input placeholder="Say something and press Enter…" aria-label="Talk to the avatar">
  <footer>Made with <a href="https://samkarri.com/studio">Avatar Studio</a></footer>
</main>
<script type="module">
${runtime}

const config = ${cfg};
const stage = document.getElementById('stage');
const input = document.querySelector('input');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const avatar = createAvatar(document.querySelector('canvas'), { looking: false, mood: 'idle', reduced }, config);
const fit = () => avatar.resize(stage.clientWidth, stage.clientHeight);
fit();
new ResizeObserver(fit).observe(stage);
document.addEventListener('visibilitychange', () => avatar.setRunning(document.visibilityState === 'visible'));

// looks down at the box while you type, nods on each key
let idle;
const glance = () => {
  avatar.set({ looking: true });
  clearTimeout(idle);
  idle = setTimeout(() => avatar.set({ looking: false }), 1600);
};
input.addEventListener('focus', glance);
input.addEventListener('input', () => { glance(); avatar.nod(); });
input.addEventListener('blur', () => { clearTimeout(idle); avatar.set({ looking: false }); });

// winks when you send, thinks for a moment, then grins
let timers = [];
input.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || !input.value.trim()) return;
  input.value = '';
  timers.forEach(clearTimeout);
  avatar.set({ looking: false, mood: 'wink' });
  timers = [
    setTimeout(() => avatar.set({ mood: 'thinking' }), 700),
    setTimeout(() => avatar.set({ mood: 'grin' }), 1700),
    setTimeout(() => avatar.set({ mood: 'idle' }), 4300),
  ];
});
</script>
</body>
</html>
`
}

export function saveFile(data: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
