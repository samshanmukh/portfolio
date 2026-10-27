import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inferBotmojiRole, isBotmojiRequest, normalizeProfileUrl, profileUrlWithScheme, botmojiEmbed, botmojiPrompt, createBotmojiConfig, parseBotmojiDesign, botmojiInspirations } from '../app/lib/botmoji.ts'
import { publicProfileMetadata } from '../app/lib/botmoji-profile.ts'
import { botmojiFrame, botmojiMotion, botmojiTapMotion, botmojiGifTimeline, BOTMOJI_TAP_SECONDS, BOTMOJI_TAP_SMILE_SECONDS, BOTMOJI_LOOP_SECONDS, BOTMOJI_MODE_SECONDS } from '../app/lib/botmoji-motion.ts'
import { botmojiArtwork, botmojiArtworkPose, BOTMOJI_ARTWORK_NAMES } from '../app/lib/botmoji-artwork.ts'

const designer = { name: 'Alex', headline: 'Product designer building accessible interfaces in Figma', role: 'designer', source: 'linkedin', profileUrl: 'https://www.linkedin.com/in/alex-designer' }

test('current headline role wins over a previous career', () => {
  assert.equal(inferBotmojiRole('Product designer at Acme, formerly a product manager'), 'designer')
  assert.equal(inferBotmojiRole('Product Manager, with an engineering background'), 'product')
  assert.equal(inferBotmojiRole('Account Executive'), 'accounts')
  assert.equal(inferBotmojiRole('Chartered Accountant'), 'accounts')
  assert.equal(inferBotmojiRole('Software Engineer'), 'engineer')
  assert.equal(inferBotmojiRole('A curious human'), 'other')
})

test('bot moji intent takes priority over generic project or LinkedIn routing', () => {
  for (const text of ['Make my bot moji', 'create a botmoji from my LinkedIn', 'bot-mojis', 'create a fluffy bot', 'make me a mascot']) assert.ok(isBotmojiRequest(text), text)
  for (const text of ['What have you built?', 'Your LinkedIn?', 'Show projects']) assert.equal(isBotmojiRequest(text), false, text)
})

test('profile URLs cannot target private hosts, credentials, ports, or redirect paths', () => {
  for (const url of [
    'https://linkedin.com.evil.com/in/alex', 'https://linkedin.com@localhost/in/alex',
    'http://linkedin.com/in/alex', 'https://127.0.0.1/in/alex',
    'https://www.linkedin.com:8080/in/alex', 'https://github.com/alex/repo',
    'https://www.linkedin.com/redirect?url=http://localhost', 'file:///etc/passwd',
  ]) assert.equal(normalizeProfileUrl(url), null, url)
  assert.deepEqual(normalizeProfileUrl('linkedin.com/in/alex/?trk=public'), { url: 'https://www.linkedin.com/in/alex', source: 'linkedin', slug: 'alex' })
  assert.equal(normalizeProfileUrl('https://github.com/alex/').source, 'github')
})

test('missing HTTPS is completed once while existing schemes stay unchanged', () => {
  const full = 'https://www.linkedin.com/in/shanmukhsain'
  for (const [input, expected] of [
    ['linkedin.com/in/shanmukhsain', 'https://linkedin.com/in/shanmukhsain'],
    ['  www.linkedin.com/in/shanmukhsain  ', full],
    [full, full],
    ['HTTPS://www.linkedin.com/in/shanmukhsain', 'HTTPS://www.linkedin.com/in/shanmukhsain'],
    ['//www.linkedin.com/in/shanmukhsain', full],
    ['github.com/alex', 'https://github.com/alex'],
    ['http://linkedin.com/in/alex', 'http://linkedin.com/in/alex'],
    ['javascript:alert(1)', 'javascript:alert(1)'],
    ['  ', ''],
  ]) {
    assert.equal(profileUrlWithScheme(input), expected)
    assert.equal(profileUrlWithScheme(expected), expected)
  }
  assert.equal(normalizeProfileUrl('  linkedin.com/in/shanmukhsain  ').url, full)
  assert.equal(normalizeProfileUrl('javascript:alert(1)'), null)
})

test('a profile produces a stable original visual recipe', () => {
  const first = createBotmojiConfig(designer)
  assert.deepEqual(createBotmojiConfig(designer), first)
  assert.ok(!Object.hasOwn(first, 'style'))
  assert.deepEqual(parseBotmojiDesign(JSON.stringify(first.design)), first.design)
})

test('two people in the same profession get different colors and geometry', () => {
  const one = createBotmojiConfig(designer).design
  const two = createBotmojiConfig({ ...designer, name: 'Avery', profileUrl: 'https://www.linkedin.com/in/avery-designer' }).design
  assert.notEqual(one.seed, two.seed)
  assert.notEqual(one.fur, two.fur)
  assert.notEqual(one.width, two.width)
  assert.notEqual(one.tuft, two.tuft)
  const recipes = Array.from({ length: 100 }, (_, i) => createBotmojiConfig({ ...designer, profileUrl: `https://www.linkedin.com/in/person-${i}` }).design)
  assert.equal(new Set(recipes.map((d) => d.seed)).size, 100)
  assert.ok(new Set(recipes.map((d) => d.fur)).size > 95)
})

test('profiles customize the fur palette without adding any accessory icons', () => {
  for (const role of ['designer','engineer','accounts','product','marketing','founder','other']) {
    const config = createBotmojiConfig({ ...designer, role, headline: 'Sustainable AI music tools, analytics, care and inclusive education' })
    assert.deepEqual(config.design.details,[])
    assert.ok(botmojiPrompt(config,designer.headline).includes('No accessories, badges, props, symbols, or floating icons'))
  }
  const climate = { ...designer, headline: 'Designer working on sustainable energy' }
  assert.notEqual(createBotmojiConfig(climate).design.fur, createBotmojiConfig(designer).design.fur)
  assert.ok(botmojiInspirations(climate).some((inspiration) => inspiration.from.includes('Sustainability') && inspiration.detail.includes('fur palette')))
})

test('work context and remix variations influence the whole design', () => {
  const initial = createBotmojiConfig(designer)
  const remixed = createBotmojiConfig(designer, 1)
  assert.notEqual(remixed.design.fur, initial.design.fur)
  assert.notEqual(remixed.design.width, initial.design.width)
  assert.deepEqual(remixed.design.details, initial.design.details)
  const changed = createBotmojiConfig({ ...designer, headline: 'Product designer building tools for climate and sustainability' })
  assert.notEqual(changed.design.seed, initial.design.seed)
  assert.deepEqual(changed.design.details,[])
  assert.ok(botmojiInspirations(designer).some((i) => i.from.includes('inclusive')))
})

test('embedding preserves the complete edited design without sharing the profile text', () => {
  const config = createBotmojiConfig({ ...designer, name: '\"><script>alert(1)</script>' })
  config.design.fur = '#aabbcc'
  config.design.details = ['heart', 'headphones']
  const code = botmojiEmbed(config, 'https://portfolio.example')
  assert.ok(!code.includes('<script>'))
  const src = code.match(/src="([^"]+)"/)[1].replaceAll('&amp;', '&')
  const url = new URL(src)
  assert.equal(url.searchParams.get('name'), config.name)
  assert.deepEqual(parseBotmojiDesign(url.searchParams.get('design')), config.design)
  assert.ok(!src.includes('accessible'))
  assert.ok(!src.includes('linkedin'))
  assert.equal(url.pathname, '/botmoji/embed')
})

test('malformed embed recipes cannot introduce CSS, unbounded rendering, or unknown accessories', () => {
  const base = createBotmojiConfig(designer).design
  for (const change of [
    { seed: -1 }, { seed: 1.2 }, { seed: 0x100000000 }, { width: 100 }, { height: null },
    { tilt: 10 }, { fluff: 999 }, { artwork: -1 }, { artwork: 6 }, { artwork: 0.5 }, { fur: 'url(https://evil.example)' }, { accent: '#xyz123' },
    { details: ['__proto__'] }, { details: ['unknown'] }, { details: Array(100).fill('heart') },
  ]) assert.equal(parseBotmojiDesign(JSON.stringify({ ...base, ...change })), null)
  for (const raw of ['null', '[]', 'not json', 'x'.repeat(2000)]) assert.equal(parseBotmojiDesign(raw), null)
})

test('all six supplied characters have valid aligned crops and facial landmarks in every expression', () => {
  assert.equal(BOTMOJI_ARTWORK_NAMES.length, 6)
  for (let family = 0; family < 6; family++) for (let state = 0; state < 4; state++) {
    const p = botmojiArtworkPose(family,state)
    assert.ok(p.sx >= family*256 && p.sx+p.sw <= (family+1)*256)
    assert.ok(p.sy >= 0 && p.sy+p.sh <= 1024)
    assert.ok(Math.abs(p.y + p.height - 248) < 1e-8, 'feet align when changing expressions')
    for (const [x,y] of [...p.eyes,p.mouth]) {
      assert.ok(x > p.x && x < p.x+p.width)
      assert.ok(y > p.y && y < 248)
    }
    assert.ok(p.eyes[0][0] < p.eyes[1][0])
    assert.ok(p.mouth[1] > Math.max(...p.eyes.map((eye) => eye[1])))
  }
})

test('role-based artwork can be changed without losing the edited palette or embed identity', () => {
  assert.equal(botmojiArtwork('designer',10),2)
  assert.equal(botmojiArtwork('engineer',10),5)
  for (let family = 0; family < 6; family++) {
    const config = createBotmojiConfig(designer)
    config.design.artwork = family
    const recipe = parseBotmojiDesign(JSON.stringify(config.design))
    assert.equal(botmojiArtwork(config.role,recipe.seed,recipe.artwork),family)
    assert.equal(recipe.fur,config.design.fur)
    assert.ok(botmojiPrompt(config,designer.headline).includes(`column ${family+1}`))
  }
})

test('the copied prompt includes the exact personal palette, silhouette, details, and context', () => {
  const config = createBotmojiConfig(designer)
  const prompt = botmojiPrompt(config, designer.headline)
  assert.ok(prompt.includes(config.design.fur))
  assert.ok(prompt.includes(config.design.width.toFixed(3)))
  assert.ok(prompt.includes('No accessories'))
  assert.ok(!prompt.includes('Tiny stylus'))
  assert.ok(prompt.includes(designer.headline))
  assert.ok(prompt.includes('rest, attending, working, responding'))
  assert.ok(prompt.includes('alpha-transparent'))
})

test('public LinkedIn metadata contributes a real name, title, and decoded biography', () => {
  const profile = publicProfileMetadata(`<title>Alex Chen - Product Designer | LinkedIn</title><meta content="Accessible interfaces &amp; thoughtful typography" name="description">`)
  assert.equal(profile.name, 'Alex Chen')
  assert.ok(profile.headline.includes('Product Designer'))
  assert.ok(profile.headline.includes('Accessible interfaces & thoughtful typography'))
})

test('structured profile skills are read only from the matching person', () => {
  const json = { '@graph': [
    { '@type': 'Person', name: 'Someone Else', jobTitle: 'Music producer', knowsAbout: ['Audio'] },
    { '@type': 'Person', name: 'Alex Chen', jobTitle: 'AI Engineer', knowsAbout: ['Machine learning', 'Accessibility'] },
  ] }
  const profile = publicProfileMetadata(`<title>Alex Chen | LinkedIn</title><meta name="description" content="Experience at Acme"><script type="application/ld+json">${JSON.stringify(json)}</script>`)
  assert.ok(profile.headline.includes('AI Engineer'))
  assert.ok(profile.headline.includes('Accessibility'))
  assert.ok(!profile.headline.includes('Music producer'))
  assert.ok(!profile.headline.includes('Audio'))
})

test('login walls are rejected and unfamiliar professions still get a personal design', () => {
  for (const title of ['Sign in | LinkedIn', 'LinkedIn', 'Security Verification | LinkedIn']) assert.equal(publicProfileMetadata(`<title>${title}</title><meta name="description" content="Join our professional community">`), null)
  const profile = publicProfileMetadata('<title>Alex Chen - Marine biologist | LinkedIn</title><meta name="description" content="Researching coral ecosystems">')
  assert.equal(profile.name, 'Alex Chen')
  assert.equal(inferBotmojiRole(profile.headline), 'other')
  const config = createBotmojiConfig({ ...profile, role: 'other', source: 'linkedin' })
  assert.ok(config.design.seed)
})

test('attending closes and reopens both eyes for a natural double blink', () => {
  assert.equal(botmojiMotion(1, 0).blink, 0)
  assert.ok(botmojiMotion(1, 0.8).blink > 0.99)
  assert.ok(botmojiMotion(1, 1).blink < 0.01)
  assert.ok(botmojiMotion(1, 1.2).blink > 0.99)
  assert.ok(botmojiMotion(1, 1.5).blink < 0.01)
  assert.notEqual(botmojiMotion(1, 0).gazeX, botmojiMotion(1, 0.7).gazeX)
})

test('working scans both directions, moves serious brows, and warms then cools the forehead', () => {
  const start = botmojiMotion(2, 0)
  const left = botmojiMotion(2, 0.45)
  const right = botmojiMotion(2, 1.35)
  const peak = botmojiMotion(2, 1.8)
  assert.ok(left.gazeX > 6)
  assert.ok(right.gazeX < -6)
  assert.ok(left.furrow > 0.7 && right.furrow > 0.7)
  assert.notEqual(left.furrow, right.furrow)
  assert.ok(peak.eyeOpen < 0.7)
  assert.equal(start.heat, 0)
  assert.ok(peak.heat > 0.7)
  assert.ok(botmojiMotion(2, 3.59999).heat < 0.001)
})

test('responding grows from a closed mouth to a big smile and closes before repeating', () => {
  const closed = botmojiMotion(3, 0)
  const opening = botmojiMotion(3, 0.8)
  const grin = botmojiMotion(3, 1.6)
  assert.equal(closed.mouthOpen, 0)
  assert.ok(opening.mouthOpen > 0 && opening.mouthOpen < grin.mouthOpen)
  assert.ok(grin.mouthOpen > 0.9)
  assert.ok(grin.smile > closed.smile)
  assert.ok(botmojiMotion(3, 3.19999).mouthOpen < 0.001)
})

test('preview and export share exact mode boundaries and selecting a mode keeps it playing', () => {
  assert.equal(botmojiFrame(0).state, 0)
  assert.equal(botmojiFrame(2.4).state, 1)
  assert.equal(botmojiFrame(5.6).state, 2)
  assert.equal(botmojiFrame(9.2).state, 3)
  assert.equal(botmojiFrame(BOTMOJI_LOOP_SECONDS).state, 0)
  assert.equal(botmojiFrame(10, 2).state, 2)
  assert.ok(Math.abs(botmojiFrame(10, 2).seconds - (10 % 3.6)) < 1e-9)
  assert.notDeepEqual(botmojiMotion(2, 0), botmojiMotion(2, 1))
  assert.deepEqual(botmojiMotion(2, 0), botmojiMotion(2, BOTMOJI_MODE_SECONDS[2]))
})

test('reduced-motion poses are static but keep the meaning of each expression', () => {
  for (let mode = 0; mode < 4; mode++) {
    assert.deepEqual(botmojiMotion(mode, 0, false), botmojiMotion(mode, 1.7, false))
    assert.equal(botmojiMotion(mode, 0, false).blink, 0)
  }
  assert.ok(botmojiMotion(2, 0, false).furrow > 0.8)
  assert.ok(botmojiMotion(2, 0, false).heat > 0)
  assert.ok(botmojiMotion(3, 0, false).mouthOpen > 0.9)
})


test('the Zup tap crouches, jumps through one full turn, lands and holds a smile', () => {
  const before = botmojiTapMotion(-1)
  assert.equal(before.active,false)
  const crouch = botmojiTapMotion(0.239)
  assert.ok(crouch.scaleX > 1.17 && crouch.scaleY < 0.81)
  assert.ok(Math.abs(crouch.y)<1e-8)
  const rising = botmojiTapMotion(0.41)
  const apex = botmojiTapMotion(0.58)
  assert.ok(rising.y < -50)
  assert.ok(apex.y < -77)
  assert.ok(Math.abs(apex.yaw-Math.PI)<1e-8)
  assert.ok(apex.scaleY > 1 && apex.scaleX < 1)
  assert.ok(apex.zoom < 0.8)
  const landed = botmojiTapMotion(1)
  assert.ok(landed.scaleY < 0.9 && landed.scaleX > 1.1)
  assert.ok(Math.abs(landed.yaw-Math.PI*2)<1e-8)
  assert.ok(Math.abs(landed.y)<1e-8)
  const smiling = botmojiTapMotion(BOTMOJI_TAP_SECONDS+0.2)
  assert.equal(smiling.scaleX,1)
  assert.equal(smiling.scaleY,1)
  assert.equal(smiling.smile,1)
  assert.equal(botmojiTapMotion(BOTMOJI_TAP_SMILE_SECONDS).active,false)
  assert.equal(botmojiTapMotion(BOTMOJI_TAP_SMILE_SECONDS).smile,0)
  assert.equal(botmojiTapMotion(0.58,-1).roll,-apex.roll)
})

test('reduced-motion taps give a smile without moving, scaling, or rotating the character', () => {
  for (const seconds of [0,0.24,0.58,1,2]) {
    const pose = botmojiTapMotion(seconds,1,true)
    assert.equal(pose.active,true)
    assert.equal(pose.smile,1)
    assert.equal(pose.y,0)
    assert.equal(pose.yaw,0)
    assert.equal(pose.roll,0)
    assert.equal(pose.scaleX,1)
    assert.equal(pose.scaleY,1)
    assert.equal(pose.zoom,1)
  }
})


test('GIF choreography preserves all expressions then includes the complete tap performance', () => {
  const frames = botmojiGifTimeline()
  assert.equal(frames.length,176)
  assert.equal(frames.reduce((sum,frame) => sum+frame.delay,0),15000)
  for (let i = 0; i < 124; i++) {
    const { delay, tap, ...pose } = frames[i]
    assert.deepEqual(pose,botmojiFrame(i/10))
    assert.equal(delay,100)
    assert.equal(tap,undefined)
  }
  const jump = frames.slice(124)
  jump.forEach((frame,i) => {
    assert.equal(frame.state,0)
    assert.equal(frame.seconds,0)
    assert.equal(frame.delay,50)
    assert.deepEqual(frame.tap,botmojiTapMotion(i/20))
  })
  const airborne = jump.filter((frame) => frame.tap.y < -0.01)
  assert.ok(airborne.length >= 13, 'the full turn has enough frames to be visible')
  assert.ok(airborne.some((frame) => frame.tap.yaw > Math.PI*0.8 && frame.tap.yaw < Math.PI*1.2), 'the back is visible halfway through')
  assert.ok(jump.some((frame) => frame.tap.yaw > Math.PI*1.9 && frame.tap.scaleY < 0.9), 'the full turn lands with a squash')
  assert.equal(jump.at(-1).tap.active,false)
  assert.equal(jump.at(-1).tap.smile,0)
  assert.equal(jump.at(-1).tap.scaleX,1)
  assert.equal(jump.at(-1).tap.scaleY,1)
})
