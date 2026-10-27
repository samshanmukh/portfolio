// During a tap, wrap the supplied pixels around a closed pillow-shaped mesh.
// This gives the turn real thickness and a fur-covered back rather than
// flipping a flat image (or showing a second face on its reverse).
type Mesh = { vertices: Float32Array; count: number; rear: HTMLCanvasElement }
const meshes = new WeakMap<ImageData, Mesh>()
const N = 65
const PAD = 1.35
let renderer: VolumeRenderer | null | undefined

function plushMesh(base: ImageData): Mesh {
  const cached = meshes.get(base)
  if (cached) return cached
  const size = base.width, total = N*N
  const mask = new Uint8Array(total)
  const distance = new Float32Array(total)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const sx = Math.min(size-1,Math.round(x/(N-1)*(size-1)))
    const sy = Math.min(size-1,Math.round(y/(N-1)*(size-1)))
    const at = y*N+x
    mask[at] = base.data[(sy*size+sx)*4+3] > 35 ? 1 : 0
    distance[at] = mask[at] ? 1000 : 0
  }
  for (let y = 1; y < N; y++) for (let x = 1; x < N; x++) {
    const at = y*N+x
    distance[at] = Math.min(distance[at],distance[at-1]+1,distance[at-N]+1,distance[at-N-1]+1.4142)
  }
  for (let y = N-2; y >= 0; y--) for (let x = N-2; x >= 0; x--) {
    const at = y*N+x
    distance[at] = Math.min(distance[at],distance[at+1]+1,distance[at+N]+1,distance[at+N+1]+1.4142)
  }
  const heights = new Float32Array(total)
  for (let y = 1; y < N-1; y++) for (let x = 1; x < N-1; x++) {
    const at = y*N+x
    if (!mask[at] || !mask[at-1] || !mask[at+1] || !mask[at-N] || !mask[at+N]) continue
    const t = Math.max(0,Math.min(1,(distance[at]-0.75)/(N*0.22)))
    heights[at] = 0.5*Math.sqrt(t*(2-t))
  }
  const vertices: number[] = []
  const vertex = (at: number, rear: number) => {
    const x = at%N, y = Math.floor(at/N), u = x/(N-1), v = y/(N-1)
    vertices.push((u-0.5)*2,(0.5-v)*2,heights[at]*(rear ? -1 : 1),u,v,rear)
  }
  const triangle = (a: number,b: number,c: number) => {
    if (!mask[a] || !mask[b] || !mask[c]) return
    for (const rear of [0,1]) { vertex(a,rear); vertex(b,rear); vertex(c,rear) }
  }
  for (let y = 0; y < N-1; y++) for (let x = 0; x < N-1; x++) {
    const a = y*N+x, b = a+1, c = a+N, d = c+1
    triangle(a,c,b); triangle(b,c,d)
  }
  const rear = document.createElement('canvas')
  rear.width = rear.height = size
  const ctx = rear.getContext('2d')!
  const fur = new ImageData(new Uint8ClampedArray(base.data),size,size)
  // Heal the face on the rear using actual body fur from the same character.
  // Feathering keeps the source tuft, shading, and alpha contour intact.
  for (let y = 70; y < 222; y++) for (let x = 25; x < 239; x++) {
    const amount = Math.max(0,Math.min(1,(1-Math.hypot((x-132)/112,(y-150)/83))*5))
    if (!amount) continue
    // Continuous coordinates avoid repeating seams during the rear view.
    const sx = 55+(x-25)/214*146, sy = 207+(y-70)/152*25
    const source = (Math.floor(sy)*size+Math.floor(sx))*4
    const at = (y*size+x)*4
    for (let c = 0; c < 3; c++) fur.data[at+c] = fur.data[at+c]*(1-amount)+base.data[source+c]*amount
  }
  ctx.putImageData(fur,0,0)
  const mesh = { vertices: new Float32Array(vertices), count: vertices.length/6, rear }
  meshes.set(base,mesh)
  return mesh
}

class VolumeRenderer {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  program: WebGLProgram
  buffer: WebGLBuffer
  front: WebGLTexture
  rear: WebGLTexture
  mesh?: Mesh
  yaw: WebGLUniformLocation | null
  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.canvas.height = 540
    const gl = this.canvas.getContext('webgl',{ alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: true })
    if (!gl) throw new Error('WebGL unavailable')
    this.gl = gl
    const shader = (type: number, source: string) => {
      const result = gl.createShader(type)!
      gl.shaderSource(result,source); gl.compileShader(result)
      if (!gl.getShaderParameter(result,gl.COMPILE_STATUS)) { gl.deleteShader(result); throw new Error('The plush turn shader could not compile.') }
      return result
    }
    const vert = shader(gl.VERTEX_SHADER,`
      attribute vec3 position;
      attribute vec2 uv;
      attribute float rear;
      uniform float yaw;
      varying vec2 textureUV;
      varying float back;
      varying float shade;
      void main() {
        float c = cos(yaw), s = sin(yaw);
        vec3 p = vec3(position.x*c+position.z*s,position.y,-position.x*s+position.z*c);
        gl_Position = vec4(p.xy/${PAD.toFixed(2)},-p.z*0.3,1.0);
        textureUV = uv;
        back = rear;
        shade = 0.88+0.12*abs(c);
      }
    `)
    const frag = shader(gl.FRAGMENT_SHADER,`
      precision mediump float;
      uniform sampler2D frontArt;
      uniform sampler2D rearArt;
      varying vec2 textureUV;
      varying float back;
      varying float shade;
      void main() {
        vec4 color = mix(texture2D(frontArt,textureUV),texture2D(rearArt,textureUV),back);
        // Geometry supplies the closed silhouette. Fill sparse edge samples
        // from matching rear fur so side views stay solid in a 1-bit GIF.
        if (color.a < 0.95) color = texture2D(rearArt,vec2(0.52,clamp(textureUV.y,0.35,0.85)));
        color.a = 1.0;
        gl_FragColor = vec4(color.rgb*shade*color.a,color.a);
      }
    `)
    const program = gl.createProgram()!
    gl.attachShader(program,vert); gl.attachShader(program,frag); gl.linkProgram(program)
    gl.deleteShader(vert); gl.deleteShader(frag)
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('The plush turn shader could not link.')
    this.program = program; gl.useProgram(program)
    this.buffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer)
    for (const [name,count,offset] of [['position',3,0],['uv',2,12],['rear',1,20]] as const) {
      const location = gl.getAttribLocation(program,name)
      gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location,count,gl.FLOAT,false,24,offset)
    }
    const texture = (unit: number, name: string) => {
      const result = gl.createTexture()!
      gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,result)
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
      gl.uniform1i(gl.getUniformLocation(program,name),unit)
      return result
    }
    this.front = texture(0,'frontArt'); this.rear = texture(1,'rearArt')
    this.yaw = gl.getUniformLocation(program,'yaw')
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0,0,0,0)
  }
  draw(image: HTMLCanvasElement, base: ImageData, yaw: number) {
    const gl = this.gl
    if (gl.isContextLost()) throw new Error('The plush turn context was lost.')
    const mesh = plushMesh(base)
    gl.useProgram(this.program)
    gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer)
    if (this.mesh !== mesh) gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW)
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this.front)
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image)
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,this.rear)
    if (this.mesh !== mesh) gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,mesh.rear)
    this.mesh = mesh
    gl.uniform1f(this.yaw,yaw)
    gl.viewport(0,0,540,540); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES,0,mesh.count)
    return this.canvas
  }
}

export function drawBotmojiTurn(ctx: CanvasRenderingContext2D, image: HTMLCanvasElement, base: ImageData, yaw: number) {
  try {
    if (renderer === undefined) renderer = new VolumeRenderer()
    if (renderer) {
      ctx.drawImage(renderer.draw(image,base,yaw),-30,-70,540,540)
      return
    }
  } catch { renderer = null }
  // Keep the tap playful on browsers where WebGL has been disabled.
  ctx.save(); ctx.translate(240,200); ctx.rotate(yaw); ctx.drawImage(image,-200,-200,400,400); ctx.restore()
}
