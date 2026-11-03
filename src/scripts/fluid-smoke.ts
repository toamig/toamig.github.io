/**
 * Cursor-driven fluid smoke on a WebGL canvas: a stable-fluids solver
 * (Jos Stam, as in Pavel Dobryakov's WebGL-Fluid-Simulation, MIT) with the
 * tuning of the gamecrio.com cursor. Velocity and dye live in half-float
 * textures; the cursor splats both, vorticity keeps it curling, and the dye
 * decays on its own so the loop can sleep once the smoke is gone.
 */

export interface FluidSmokeOptions {
  /** Hue range start, 0..1. Brightness is fixed at full. */
  hue: number;
  /** How far past `hue` each splat may drift. */
  hueSpread: number;
  /** Saturation range, 0..1. Lower reads as a lighter, more luminous haze. */
  saturation: [number, number];
}

interface Format { internalFormat: number; format: number }
interface Target {
  texture: WebGLTexture; fbo: WebGLFramebuffer;
  width: number; height: number; texelX: number; texelY: number;
  attach(unit: number): number;
}
interface DoubleTarget {
  width: number; height: number; texelX: number; texelY: number;
  read: Target; write: Target; swap(): void;
}
interface Program { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> }

const SIM_TEXEL_PX = 6.5;          // css px per velocity cell, matches the reference at 1015x768
const DYE_OVERSAMPLE = 1.9;        // dye texels per canvas px, matches the reference
const DYE_MAX = 1440;
const VELOCITY_DISSIPATION = 2;
const DENSITY_DISSIPATION = 3.5;
const PRESSURE = 0.1;
const PRESSURE_ITERATIONS = 20;
const CURL = 3;
const SPLAT_PX = 26;               // css px to where a splat falls to 1/e (the reference gives about 40 at 1015x768, thinned on purpose)
const SPLAT_FORCE = 6000;
const COLOR_SCALE = 0.15;
const COLOR_PERIOD = 0.1;          // s between colour changes
const SLEEP_AFTER = 4000;          // ms of stillness before the loop stops

const VERTEX = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
  uniform vec2 texelSize;
  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }`;

const DISPLAY = `
  precision highp float; precision highp sampler2D;
  varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
  uniform sampler2D uTexture;
  uniform vec2 texelSize;
  void main () {
    vec3 c = texture2D(uTexture, vUv).rgb;
    #ifdef SHADING
      vec3 lc = texture2D(uTexture, vL).rgb;
      vec3 rc = texture2D(uTexture, vR).rgb;
      vec3 tc = texture2D(uTexture, vT).rgb;
      vec3 bc = texture2D(uTexture, vB).rgb;
      float dx = length(rc) - length(lc);
      float dy = length(tc) - length(bc);
      vec3 n = normalize(vec3(dx, dy, length(texelSize)));
      vec3 l = vec3(0.0, 0.0, 1.0);
      float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
      c *= diffuse;
    #endif
    float a = max(c.r, max(c.g, c.b));
    gl_FragColor = vec4(c, a);
  }`;

const ADVECTION = `
  precision highp float; precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uVelocity; uniform sampler2D uSource;
  uniform vec2 texelSize; uniform vec2 dyeTexelSize;
  uniform float dt; uniform float dissipation;
  vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }
  void main () {
    #ifdef MANUAL_FILTERING
      vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
      vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      vec4 result = texture2D(uSource, coord);
    #endif
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
  }`;

const COPY = `
  precision mediump float; precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  void main () { gl_FragColor = texture2D(uTexture, vUv); }`;

const CLEAR = `
  precision mediump float; precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture; uniform float value;
  void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`;

const SPLAT = `
  precision highp float; precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTarget; uniform float aspectRatio;
  uniform vec3 color; uniform vec2 point; uniform float radius;
  void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }`;

const NEIGHBOURS = `
  precision mediump float; precision mediump sampler2D;
  varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;`;

const DIVERGENCE = `${NEIGHBOURS}
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }`;

const CURL_SHADER = `${NEIGHBOURS}
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }`;

const VORTICITY = `
  precision highp float; precision highp sampler2D;
  varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
  uniform sampler2D uVelocity; uniform sampler2D uCurl;
  uniform float curl; uniform float dt;
  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }`;

const PRESSURE_SHADER = `${NEIGHBOURS}
  uniform sampler2D uPressure; uniform sampler2D uDivergence;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }`;

const GRADIENT = `${NEIGHBOURS}
  uniform sampler2D uPressure; uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }`;

function hsv(h: number, s: number, v: number) {
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: return { r: v, g: t, b: p };
    case 1: return { r: q, g: v, b: p };
    case 2: return { r: p, g: v, b: t };
    case 3: return { r: p, g: q, b: v };
    case 4: return { r: t, g: p, b: v };
    default: return { r: v, g: p, b: q };
  }
}

/**
 * Mounts the smoke on `canvas`, driven by the pointer over `host`. Returns a
 * teardown, or null where WebGL, half-float targets, a fine pointer or motion
 * are unavailable (the caller keeps its plain background).
 */
export function mountFluidSmoke(canvas: HTMLCanvasElement, host: HTMLElement, options: FluidSmokeOptions): (() => void) | null {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return null;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  const attrs = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
  const gl2 = canvas.getContext('webgl2', attrs);
  const isGL2 = gl2 !== null;
  const context = (gl2 ?? canvas.getContext('webgl', attrs)) as WebGL2RenderingContext | WebGLRenderingContext | null;
  if (!context) return null;
  const gl: WebGL2RenderingContext | WebGLRenderingContext = context;
  const g = gl as WebGL2RenderingContext;

  let halfFloat: number;
  let linearFloat: boolean;
  if (isGL2) {
    gl.getExtension('EXT_color_buffer_float');
    linearFloat = gl.getExtension('OES_texture_float_linear') !== null;
    halfFloat = g.HALF_FLOAT;
  } else {
    const ext = gl.getExtension('OES_texture_half_float');
    linearFloat = gl.getExtension('OES_texture_half_float_linear') !== null;
    if (!ext) return null;
    halfFloat = ext.HALF_FLOAT_OES;
  }
  gl.clearColor(0, 0, 0, 1);

  const renderable = (internalFormat: number, format: number, type: number) => {
    const texture = gl.createTexture(), fbo = gl.createFramebuffer();
    if (!texture || !fbo) return false;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(texture);
    return ok;
  };
  const pickFormat = (internalFormat: number, format: number, type: number): Format | null => {
    if (renderable(internalFormat, format, type)) return { internalFormat, format };
    if (internalFormat === g.R16F) return pickFormat(g.RG16F, g.RG, type);
    if (internalFormat === g.RG16F) return pickFormat(g.RGBA16F, g.RGBA, type);
    return null;
  };

  let rgba: Format | null, rg: Format | null, r: Format | null;
  if (isGL2) {
    rgba = pickFormat(g.RGBA16F, g.RGBA, halfFloat);
    rg = pickFormat(g.RG16F, g.RG, halfFloat);
    r = pickFormat(g.R16F, g.RED, halfFloat);
  } else {
    rgba = rg = r = pickFormat(gl.RGBA, gl.RGBA, halfFloat);
  }
  if (!rgba || !rg || !r) return null;

  const shaders: WebGLShader[] = [];
  const programs: WebGLProgram[] = [];
  const buffers: WebGLBuffer[] = [];
  const textures: WebGLTexture[] = [];
  const framebuffers: WebGLFramebuffer[] = [];
  const dispose = () => {
    framebuffers.forEach(f => gl.deleteFramebuffer(f));
    textures.forEach(t => gl.deleteTexture(t));
    programs.forEach(p => gl.deleteProgram(p));
    shaders.forEach(s => gl.deleteShader(s));
    buffers.forEach(b => gl.deleteBuffer(b));
    framebuffers.length = textures.length = programs.length = shaders.length = buffers.length = 0;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };

  const compile = (type: number, source: string, defines: string[] = []) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, defines.map(d => `#define ${d}\n`).join('') + source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
    shaders.push(shader);
    return shader;
  };
  const link = (vertex: WebGLShader, fragment: WebGLShader): Program | null => {
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return null; }
    programs.push(program);
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program, uniforms };
  };

  // Without linear filtering on float targets the sim filters by hand, on a
  // smaller dye grid and without the soft shading.
  const dyeMax = linearFloat ? DYE_MAX : 256;
  const shading = linearFloat;

  const vertex = compile(gl.VERTEX_SHADER, VERTEX);
  const frag = (source: string, defines?: string[]) => compile(gl.FRAGMENT_SHADER, source, defines);
  const fragments = {
    display: frag(DISPLAY, shading ? ['SHADING'] : []), advection: frag(ADVECTION, linearFloat ? [] : ['MANUAL_FILTERING']),
    copy: frag(COPY), clear: frag(CLEAR), splat: frag(SPLAT), divergence: frag(DIVERGENCE), curl: frag(CURL_SHADER),
    vorticity: frag(VORTICITY), pressure: frag(PRESSURE_SHADER), gradient: frag(GRADIENT),
  };
  if (!vertex || Object.values(fragments).some(f => !f)) { dispose(); return null; }
  const make = (fragment: WebGLShader | null) => link(vertex, fragment!);
  const prog = {
    copy: make(fragments.copy), clear: make(fragments.clear), splat: make(fragments.splat),
    advection: make(fragments.advection), divergence: make(fragments.divergence), curl: make(fragments.curl),
    vorticity: make(fragments.vorticity), pressure: make(fragments.pressure), gradient: make(fragments.gradient),
    display: make(fragments.display),
  };
  if (Object.values(prog).some(p => !p)) { dispose(); return null; }
  const P = prog as Record<keyof typeof prog, Program>;

  const quad = gl.createBuffer(), indices = gl.createBuffer();
  if (!quad || !indices) { dispose(); return null; }
  buffers.push(quad, indices);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  const blit = (target: Target | null) => {
    if (target) { gl.viewport(0, 0, target.width, target.height); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
    else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  };

  const createTarget = (width: number, height: number, f: Format, filter: number): Target | null => {
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture(), fbo = gl.createFramebuffer();
    if (!texture || !fbo) return null;
    textures.push(texture); framebuffers.push(fbo);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, f.internalFormat, width, height, 0, f.format, halfFloat, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return {
      texture, fbo, width, height, texelX: 1 / width, texelY: 1 / height,
      attach(unit) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, texture); return unit; },
    };
  };
  const destroyTarget = (t: Target) => {
    gl.deleteFramebuffer(t.fbo); gl.deleteTexture(t.texture);
    const fi = framebuffers.indexOf(t.fbo); if (fi !== -1) framebuffers.splice(fi, 1);
    const ti = textures.indexOf(t.texture); if (ti !== -1) textures.splice(ti, 1);
  };
  const createDouble = (width: number, height: number, f: Format, filter: number): DoubleTarget | null => {
    const a = createTarget(width, height, f, filter), b = createTarget(width, height, f, filter);
    if (!a || !b) return null;
    let read = a, write = b;
    return {
      width, height, texelX: a.texelX, texelY: a.texelY,
      get read() { return read; }, set read(v) { read = v; },
      get write() { return write; }, set write(v) { write = v; },
      swap() { const t = read; read = write; write = t; },
    };
  };
  // Resize keeps what is on screen by copying the old read target across.
  const resizeDouble = (t: DoubleTarget, width: number, height: number, f: Format, filter: number) => {
    if (t.width === width && t.height === height) return t;
    const next = createTarget(width, height, f, filter), spare = createTarget(width, height, f, filter);
    if (!next || !spare) return null;
    gl.useProgram(P.copy.program);
    gl.uniform1i(P.copy.uniforms.uTexture, t.read.attach(0));
    blit(next);
    destroyTarget(t.read); destroyTarget(t.write);
    t.read = next; t.write = spare;
    t.width = width; t.height = height; t.texelX = 1 / width; t.texelY = 1 / height;
    return t;
  };

  let dye: DoubleTarget | null = null, velocity: DoubleTarget | null = null;
  let divergence: Target | null = null, curl: Target | null = null, pressure: DoubleTarget | null = null;

  const gridSize = (short: number) => {
    let aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspect < 1) aspect = 1 / aspect;
    const lo = Math.round(short), hi = Math.round(short * aspect);
    return gl.drawingBufferWidth > gl.drawingBufferHeight ? { width: hi, height: lo } : { width: lo, height: hi };
  };

  function buildTargets() {
    const cssShort = Math.min(canvas.clientWidth, canvas.clientHeight);
    const simShort = Math.max(32, Math.min(128, cssShort / SIM_TEXEL_PX));
    const dyeShort = Math.min(dyeMax, Math.min(canvas.width, canvas.height) * DYE_OVERSAMPLE);
    const sim = gridSize(simShort), dyeSize = gridSize(dyeShort);
    const filter = linearFloat ? gl.LINEAR : gl.NEAREST;
    gl.disable(gl.BLEND);
    dye = dye ? resizeDouble(dye, dyeSize.width, dyeSize.height, rgba!, filter) : createDouble(dyeSize.width, dyeSize.height, rgba!, filter);
    velocity = velocity ? resizeDouble(velocity, sim.width, sim.height, rg!, filter) : createDouble(sim.width, sim.height, rg!, filter);
    if (divergence) destroyTarget(divergence);
    if (curl) destroyTarget(curl);
    divergence = createTarget(sim.width, sim.height, r!, gl.NEAREST);
    curl = createTarget(sim.width, sim.height, r!, gl.NEAREST);
    pressure = pressure ? resizeDouble(pressure, sim.width, sim.height, r!, gl.NEAREST) : createDouble(sim.width, sim.height, r!, gl.NEAREST);
    return !!(dye && velocity && divergence && curl && pressure);
  }

  const { hue, hueSpread, saturation: [satLow, satHigh] } = options;
  const newColor = () => {
    const c = hsv(hue + hueSpread * Math.random(), satLow + (satHigh - satLow) * Math.random(), 1);
    return { r: c.r * COLOR_SCALE, g: c.g * COLOR_SCALE, b: c.b * COLOR_SCALE };
  };

  const pointer = { x: 0, y: 0, px: 0, py: 0, dx: 0, dy: 0, moved: false, color: newColor() };
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

  function splat(x: number, y: number, dx: number, dy: number, color: { r: number; g: number; b: number }) {
    if (!velocity || !dye) return;
    const aspect = canvas.width / canvas.height;
    gl.useProgram(P.splat.program);
    gl.uniform1i(P.splat.uniforms.uTarget, velocity.read.attach(0));
    gl.uniform1f(P.splat.uniforms.aspectRatio, aspect);
    gl.uniform2f(P.splat.uniforms.point, x, y);
    gl.uniform3f(P.splat.uniforms.color, dx, dy, 0);
    // The shader measures distance in canvas heights, so size it from the css height.
    gl.uniform1f(P.splat.uniforms.radius, (SPLAT_PX / canvas.clientHeight) ** 2);
    blit(velocity.write); velocity.swap();
    gl.uniform1i(P.splat.uniforms.uTarget, dye.read.attach(0));
    gl.uniform3f(P.splat.uniforms.color, color.r, color.g, color.b);
    blit(dye.write); dye.swap();
  }

  function step(dt: number) {
    if (!velocity || !dye || !divergence || !curl || !pressure) return;
    gl.disable(gl.BLEND);
    const texel = (p: Program) => gl.uniform2f(p.uniforms.texelSize, velocity!.texelX, velocity!.texelY);

    gl.useProgram(P.curl.program); texel(P.curl);
    gl.uniform1i(P.curl.uniforms.uVelocity, velocity.read.attach(0));
    blit(curl);

    gl.useProgram(P.vorticity.program); texel(P.vorticity);
    gl.uniform1i(P.vorticity.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(P.vorticity.uniforms.uCurl, curl.attach(1));
    gl.uniform1f(P.vorticity.uniforms.curl, CURL);
    gl.uniform1f(P.vorticity.uniforms.dt, dt);
    blit(velocity.write); velocity.swap();

    gl.useProgram(P.divergence.program); texel(P.divergence);
    gl.uniform1i(P.divergence.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence);

    gl.useProgram(P.clear.program);
    gl.uniform1i(P.clear.uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(P.clear.uniforms.value, PRESSURE);
    blit(pressure.write); pressure.swap();

    gl.useProgram(P.pressure.program); texel(P.pressure);
    gl.uniform1i(P.pressure.uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(P.pressure.uniforms.uPressure, pressure.read.attach(1));
      blit(pressure.write); pressure.swap();
    }

    gl.useProgram(P.gradient.program); texel(P.gradient);
    gl.uniform1i(P.gradient.uniforms.uPressure, pressure.read.attach(0));
    gl.uniform1i(P.gradient.uniforms.uVelocity, velocity.read.attach(1));
    blit(velocity.write); velocity.swap();

    gl.useProgram(P.advection.program); texel(P.advection);
    if (!linearFloat) gl.uniform2f(P.advection.uniforms.dyeTexelSize, velocity.texelX, velocity.texelY);
    const v = velocity.read.attach(0);
    gl.uniform1i(P.advection.uniforms.uVelocity, v);
    gl.uniform1i(P.advection.uniforms.uSource, v);
    gl.uniform1f(P.advection.uniforms.dt, dt);
    gl.uniform1f(P.advection.uniforms.dissipation, VELOCITY_DISSIPATION);
    blit(velocity.write); velocity.swap();

    if (!linearFloat) gl.uniform2f(P.advection.uniforms.dyeTexelSize, dye.texelX, dye.texelY);
    gl.uniform1i(P.advection.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(P.advection.uniforms.uSource, dye.read.attach(1));
    gl.uniform1f(P.advection.uniforms.dissipation, DENSITY_DISSIPATION);
    blit(dye.write); dye.swap();
  }

  function render() {
    if (!dye) return;
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.useProgram(P.display.program);
    if (shading) gl.uniform2f(P.display.uniforms.texelSize, 1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
    gl.uniform1i(P.display.uniforms.uTexture, dye.read.attach(0));
    blit(null);
  }

  /** Match the drawing buffer to the css box. Returns true when it changed. */
  function fit() {
    const w = Math.floor(canvas.clientWidth * dpr()), h = Math.floor(canvas.clientHeight * dpr());
    if (!w || !h || (canvas.width === w && canvas.height === h)) return false;
    canvas.width = w; canvas.height = h;
    return true;
  }

  let raf = 0, last = 0, lastActive = 0, colorTimer = 0, needsFit = true, disposed = false;

  function frame() {
    if (disposed) return;
    if (needsFit) {
      needsFit = false;
      if (fit() && !buildTargets()) { stop(); return; }
    }
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.016666);
    last = now;
    colorTimer += dt * (1 / COLOR_PERIOD);
    if (colorTimer >= 1) { colorTimer %= 1; pointer.color = newColor(); }
    if (pointer.moved) {
      pointer.moved = false;
      splat(pointer.x, pointer.y, SPLAT_FORCE * pointer.dx, SPLAT_FORCE * pointer.dy, pointer.color);
    }
    step(dt);
    render();
    if (now - lastActive > SLEEP_AFTER) { raf = 0; return; }
    raf = requestAnimationFrame(frame);
  }
  function wake() {
    lastActive = performance.now();
    if (raf || disposed) return;
    last = lastActive;
    raf = requestAnimationFrame(frame);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  const place = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * dpr()), y = Math.floor((e.clientY - rect.top) * dpr());
    return { x: x / canvas.width, y: 1 - y / canvas.height };
  };
  const aspect = () => canvas.width / canvas.height;

  const onEnter = (e: MouseEvent) => {
    const p = place(e);
    pointer.x = pointer.px = p.x; pointer.y = pointer.py = p.y;
    pointer.dx = pointer.dy = 0; pointer.moved = false;
    pointer.color = newColor();
  };
  const onMove = (e: MouseEvent) => {
    const p = place(e), a = aspect();
    pointer.px = pointer.x; pointer.py = pointer.y;
    pointer.x = p.x; pointer.y = p.y;
    const dx = pointer.x - pointer.px, dy = pointer.y - pointer.py;
    pointer.dx = a < 1 ? dx * a : dx;
    pointer.dy = a > 1 ? dy / a : dy;
    pointer.moved = pointer.dx !== 0 || pointer.dy !== 0;
    wake();
  };
  const onDown = (e: MouseEvent) => {
    const p = place(e);
    pointer.x = pointer.px = p.x; pointer.y = pointer.py = p.y;
    pointer.dx = pointer.dy = 0; pointer.moved = false;
    pointer.color = newColor();
    const burst = newColor();
    burst.r *= 10; burst.g *= 10; burst.b *= 10;
    splat(p.x, p.y, 10 * (Math.random() - 0.5), 30 * (Math.random() - 0.5), burst);
    wake();
  };
  const onLost = (e: Event) => { e.preventDefault(); stop(); canvas.style.display = 'none'; };

  const resizeObserver = new ResizeObserver(() => { needsFit = true; if (!raf) wake(); });
  resizeObserver.observe(canvas);
  host.addEventListener('mouseenter', onEnter, { passive: true });
  host.addEventListener('mousemove', onMove, { passive: true });
  host.addEventListener('mousedown', onDown, { passive: true });
  canvas.addEventListener('webglcontextlost', onLost);

  // First fit happens now so a failure falls back to the plain hero at once.
  needsFit = false;
  if (!fit() || !buildTargets()) {
    resizeObserver.disconnect();
    host.removeEventListener('mouseenter', onEnter);
    host.removeEventListener('mousemove', onMove);
    host.removeEventListener('mousedown', onDown);
    canvas.removeEventListener('webglcontextlost', onLost);
    dispose();
    return null;
  }

  return () => {
    disposed = true;
    stop();
    resizeObserver.disconnect();
    host.removeEventListener('mouseenter', onEnter);
    host.removeEventListener('mousemove', onMove);
    host.removeEventListener('mousedown', onDown);
    canvas.removeEventListener('webglcontextlost', onLost);
    dispose();
  };
}
