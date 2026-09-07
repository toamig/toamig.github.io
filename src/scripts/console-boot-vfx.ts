import { AdditiveBlending, BufferAttribute, Camera, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer } from 'three';
import { BOOT_BURST, type BootRenderer } from './console-boot-timeline';

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }
`;

const atmosphere = /* glsl */ `
  uniform float uTime;
  uniform float uBurst;
  uniform vec2 uResolution;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+1.), f.x), f.y);
  }
  void main() {
    vec2 p = (vUv-.5) * vec2(uResolution.x/uResolution.y, 1.);
    float t = uTime, age = max(0., t-uBurst);
    float field = smoothstep(4.65, 5.7, t);
    float warm = smoothstep(uBurst, uBurst+.48, t);
    float d = length(p);
    float mist = noise(p*3. + vec2(t*.025, 0.));
    mist += noise(p*7. - vec2(0., t*.035))*.35;
    vec3 blue = vec3(.024,.058,.12);
    vec3 gold = vec3(.063,.045,.025);
    vec3 color = mix(blue, gold, warm) * exp(-d*d*1.7) * field * (.6 + mist*.55);
    // A light source through suspended dust, with a broad optical bloom and a fine flare.
    float charge = smoothstep(6.65, uBurst, t) * (1.-smoothstep(uBurst, uBurst+.5, t));
    float flash = exp(-age*5.8) * step(uBurst, t);
    color += vec3(.60,.79,1.) * charge * exp(-d*d*24.) * .65;
    color += vec3(1.,.96,.83) * flash * (exp(-d*d*2.2)*.8 + exp(-d*d*38.)*1.1);
    color += mix(vec3(.35,.58,.9),vec3(.85,.72,.48),warm) *
      exp(-abs(p.y)*170.) * exp(-abs(p.x)*3.) * (charge*.15+flash*.5);
    float arrival = smoothstep(7.85,8.6,t) * (1.-smoothstep(9.2,10.2,t));
    color += vec3(.65,.75,.89) * exp(-d*d*95.) * arrival * .12;
    // Dither the very dark gradients without an image texture or a visible grain overlay.
    color += (hash(gl_FragCoord.xy)-.5) / 255. * field;
    color *= 1.-smoothstep(.45,1.15,d)*.75;
    gl_FragColor = vec4(max(color,vec3(0.)),1.);
  }
`;

const particleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uBurst;
  uniform vec2 uResolution;
  attribute vec4 aSeed;
  attribute float aBokeh;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vBokeh;
  varying float vSoftness;
  void main() {
    vUv = uv;
    float t = uTime, age = max(0.,t-uBurst), fieldTime = max(0.,t-4.65);
    float warm = smoothstep(uBurst-.04,uBurst+.35,t);
    float rush = smoothstep(6.6,uBurst,t);
    float depth = .45 + aSeed.z*3.4;
    float angle = fieldTime * (.018 + aSeed.w*.015);
    mat2 rotation = mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
    vec2 world = (aSeed.xy-.5) * vec2(5.7,3.5);
    world += vec2(sin(fieldTime*.19 + aSeed.w*60.), cos(fieldTime*.16+aSeed.z*50.))*.045;
    world = rotation * world;
    float forward = 1. + fieldTime*.035 + rush*rush*.7;
    vec2 bluePosition = world / depth * forward;
    // The reveal travels through a volume, then decelerates into an entire field of gold.
    float expansion = .2 + (1.-exp(-age*4.2))*1.04;
    vec2 goldPosition = world / depth * expansion;
    goldPosition += vec2(age*.024*(aSeed.z-.5), age*.015);
    vec2 center = mix(bluePosition,goldPosition,warm);
    float focusPlane = mix(1.7,2.5,smoothstep(5.,7.1,t));
    float defocus = clamp(abs(depth-focusPlane)/2.2,0.,1.);
    vSoftness = defocus;
    vBokeh = aBokeh;
    float radius = mix(.002+pow(aSeed.w,2.)*.004, .024+pow(defocus,1.6)*.11, aBokeh);
    radius *= mix(1., .56, warm) * (1.+rush*.18) / pow(depth,.25);
    float streak = (exp(-age*5.5)*step(uBurst,t)*14.+rush*2.)*(1.-aBokeh);
    vec2 tangent = normalize(center + vec2(.001));
    vec2 side = vec2(-tangent.y,tangent.x);
    vec2 offset = tangent * position.x * radius * (1.+streak) + side * position.y * radius;
    vec2 screen = center + offset;
    screen.x /= uResolution.x/uResolution.y;
    gl_Position = vec4(screen*2.,0.,1.);
    float field = smoothstep(4.75,5.9,t);
    float twinkle = .72 + .28*sin(t*(.8+aSeed.w)+aSeed.x*70.);
    float dimCenter = mix(1.,smoothstep(.035,.24,length(center)),smoothstep(8.,8.7,t));
    vAlpha = mix(.38+aSeed.w*.85, .14+aSeed.w*.3, aBokeh) * field * twinkle * dimCenter;
    vAlpha *= mix(1.,1.35,warm);
    vColor = mix(mix(vec3(.29,.51,.89),vec3(.67,.84,1.),aSeed.w),
      mix(vec3(.65,.37,.10),vec3(1.,.87,.56),aSeed.w),warm);
  }
`;

const particleFragment = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vBokeh;
  varying float vSoftness;
  void main() {
    vec2 p = vUv*2.-1.;
    float r = length(p);
    if (r > 1.) discard;
    float core = exp(-r*r*20.);
    float bloom = exp(-r*r*5.5) * .26;
    float edge = 1.-smoothstep(.57, .94, r);
    float rim = exp(-pow((r-.62)/(.09+vSoftness*.12),2.))*.12;
    float lens = mix(edge*.5+rim, exp(-r*r*3.2)*.53, vSoftness);
    float light = mix(core+bloom,lens,vBokeh);
    vec3 tint = vColor + vec3(.46,.43,.36)*core*(1.-vBokeh);
    gl_FragColor = vec4(tint, light*vAlpha);
  }
`;

/** Two draw calls, instanced lens sprites, and no allocations in the animation loop. */
export function createBootVfx(canvas: HTMLCanvasElement): BootRenderer {
  const renderer = new WebGLRenderer({canvas, alpha:false, antialias:false, depth:false, stencil:false, powerPreference:'default'});
  const scene = new Scene();
  const camera = new Camera();
  const uniforms = {uTime:{value:0},uBurst:{value:BOOT_BURST},uResolution:{value:new Vector2(1,1)}};
  const backgroundGeometry = new PlaneGeometry(2,2);
  const backgroundMaterial = new ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:atmosphere,depthTest:false,depthWrite:false});
  const background = new Mesh(backgroundGeometry,backgroundMaterial);
  background.frustumCulled = false;
  background.renderOrder = 0;
  scene.add(background);

  const count = 1800;
  const geometry = new InstancedBufferGeometry();
  geometry.setAttribute('position',new BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3));
  geometry.setAttribute('uv',new BufferAttribute(new Float32Array([0,0,1,0,1,1,0,1]),2));
  geometry.setIndex([0,1,2,0,2,3]);
  const seeds = new Float32Array(count*4), kinds = new Float32Array(count);
  let seed = 187;
  for (let i=0;i<count;i++) {
    for (let c=0;c<4;c++) { seed = (Math.imul(seed,1664525)+1013904223) >>> 0; seeds[i*4+c] = seed/4294967296; }
    kinds[i] = i%11 === 0 ? 1 : 0;
  }
  geometry.setAttribute('aSeed',new InstancedBufferAttribute(seeds,4));
  geometry.setAttribute('aBokeh',new InstancedBufferAttribute(kinds,1));
  geometry.instanceCount = count;
  const material = new ShaderMaterial({uniforms,vertexShader:particleVertex,fragmentShader:particleFragment,transparent:true,blending:AdditiveBlending,depthTest:false,depthWrite:false});
  const particles = new Mesh(geometry,material);
  particles.frustumCulled = false;
  particles.renderOrder = 1;
  scene.add(particles);
  let quality = 1, slowFrames = 0, previous = 0;

  const resize = () => {
    const width = Math.max(1,canvas.clientWidth), height = Math.max(1,canvas.clientHeight);
    const ratio = Math.min(devicePixelRatio || 1,1.75,Math.sqrt(2400000/(width*height))) * quality;
    renderer.setPixelRatio(ratio);
    renderer.setSize(width,height,false);
    uniforms.uResolution.value.set(width,height);
  };
  resize();
  renderer.compile(scene,camera);
  canvas.dataset.renderer = 'webgl';
  return {
    draw(time) {
      uniforms.uTime.value = time;
      renderer.render(scene,camera);
      const now = performance.now();
      if (previous && time>5 && now-previous>27) slowFrames++; else slowFrames=Math.max(0,slowFrames-1);
      if (slowFrames>18 && quality>.6) { quality*=.8; slowFrames=0; resize(); }
      previous=now;
    },
    resize,
    dispose() { geometry.dispose(); material.dispose(); backgroundGeometry.dispose(); backgroundMaterial.dispose(); renderer.dispose(); },
  };
}
