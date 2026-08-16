// webgl-fx.js — shared WebGL premium-effect renderer. The 9 shaders are ported VERBATIM from the approved
// fx-lab.html so the on-chain result matches the lab exactly. Used by the site (Effects preview + static
// image) and the animation renderer.
//
// applyWebglEffect(ctx, size, key, time): runs the effect over the machine ALREADY drawn on `ctx`. The machine
// MUST be on a TRANSPARENT background (the shader fills the backdrop itself and masks on alpha). It replaces
// ctx's pixels with the effected frame. Returns true if applied, false (no-op) if the key isn't a WebGL effect
// or WebGL is unavailable — callers keep their normal render on false.

// Effect KEY → shader mode. "hologram" (not "holo") avoids colliding with the legacy 2D Holo effect (partId 2).
export const FX_MODE = { plain: 0, living: 1, molten: 2, gold: 3, plasma: 4, crystal: 5, aurora: 6, mercury: 7, toxic: 8, hologram: 9 };
// on-chain partId → effect key. 1/2/3 = legacy 2D effects (Neon/Holo/Teal); premium WebGL effects are 4..12.
export const PREMIUM_PART_KEYS = { 4: "living", 5: "molten", 6: "gold", 7: "plasma", 8: "crystal", 9: "aurora", 10: "mercury", 11: "toxic", 12: "hologram" };
export const PREMIUM_KEYS = new Set(Object.values(PREMIUM_PART_KEYS));
export const isPremiumEffect = (key) => PREMIUM_KEYS.has(key);

const VS = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = vec2(p.x*0.5+0.5, 0.5-p.y*0.5); gl_Position = vec4(p,0.,1.); }`;
const FS = `precision highp float;
uniform sampler2D uTex; uniform float uTime; uniform vec2 uRes; uniform int uMode; uniform int uTransparentBg;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.02+3.1; a*=.5; } return v; }
float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }
vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d){ return a + b*cos(6.28318*(c*t+d)); }
void main(){
  vec2 uv = vUv; float t = uTime; int M = uMode;
  float warp = 0.0;
  if(M==1) warp = 0.028; else if(M==3) warp = 0.016;
  vec2 duv = uv;
  if(warp>0.0){ vec2 w = vec2(fbm(uv*3.2+vec2(0.,t*0.35)), fbm(uv*3.2+vec2(5.2,-t*0.28+1.3))); duv += (w-0.5)*warp; }
  vec4 col = texture2D(uTex, duv);
  if(col.a < 0.06){ gl_FragColor = (uTransparentBg==1) ? vec4(0.0) : vec4(0.015,0.02,0.035,1.0); return; }
  vec3 rgb = col.rgb; float L = lum(rgb);
  float e = 1.6/uRes.x;
  float lx = lum(texture2D(uTex,duv+vec2(e,0.)).rgb) - lum(texture2D(uTex,duv-vec2(e,0.)).rgb);
  float ly = lum(texture2D(uTex,duv+vec2(0.,e)).rgb) - lum(texture2D(uTex,duv-vec2(0.,e)).rgb);
  vec3 n = normalize(vec3(-lx*5.0, -ly*5.0, 1.0));
  float ang = (M==1||M==5||M==7) ? 0.6 : t*0.9;
  vec3 Ld = normalize(vec3(cos(ang), sin(ang)*0.5+0.35, 0.85));
  float diff = clamp(dot(n,Ld)*0.5+0.5, 0.0, 1.0);
  float spec = pow(clamp(dot(n, normalize(Ld+vec3(0,0,1))),0.0,1.0), 30.0);
  float fres = pow(1.0 - clamp(n.z,0.0,1.0), 3.0);
  vec3 o = rgb;
  if(M==1){ float ph = n.x*2.2+n.y*2.2+L*3.0+t*0.55; vec3 ir = 0.5+0.5*cos(6.2831853*(ph+vec3(0.,0.33,0.67)));
    o = mix(rgb*(0.4+0.85*diff)+spec*vec3(1.,.96,.9)*1.3, (rgb*(0.4+0.85*diff))*ir*1.5+ir*0.15, 0.55); o += smoothstep(0.72,1.,L)*0.5*ir; }
  else if(M==2){ float fl = fbm(duv*4.0+vec2(0.,-t*0.6)); float heat = clamp(L*0.6+fl*0.7,0.,1.);
    vec3 lava = clamp(pal(heat, vec3(0.5,0.1,0.0), vec3(0.6,0.35,0.1), vec3(1.,1.,1.), vec3(0.,0.15,0.25))*1.4,0.,2.);
    float crack = smoothstep(0.47,0.5,fl)-smoothstep(0.5,0.53,fl);
    o = lava*(0.25+0.6*diff) + crack*vec3(1.,0.7,0.2)*2.0 + smoothstep(0.7,1.,heat)*vec3(1.,0.8,0.4)*1.2; }
  else if(M==3){ float g = clamp(L*1.15,0.,1.);
    vec3 gold = mix(vec3(0.20,0.12,0.02), vec3(1.0,0.78,0.28), smoothstep(0.0,0.7,g));
    gold = mix(gold, vec3(1.0,0.95,0.72), smoothstep(0.7,1.0,g));
    o = gold*(0.35+0.9*diff) + spec*vec3(1.0,0.92,0.6)*2.6 + smoothstep(0.82,1.,L+spec*0.5)*vec3(1.0,0.95,0.72)*1.2; }
  else if(M==4){ float en = fbm(duv*4.0+vec2(t*0.3,-t*0.4));
    float veins = smoothstep(0.78,0.92,en)*(0.6+0.4*sin(t*4.0+en*10.0));
    vec3 pl = mix(vec3(0.14,0.05,0.34), vec3(0.30,0.80,1.0), clamp(L*1.2,0.,1.));
    o = pl*(0.5+0.7*diff) + veins*vec3(0.5,0.95,1.0)*2.2 + spec*vec3(0.8,0.95,1.0)*1.5 + smoothstep(0.7,1.,L)*vec3(0.4,0.8,1.0)*0.5; }
  else if(M==5){ float ca = 0.005;
    vec3 g = vec3(texture2D(uTex,duv+vec2(ca,0.)).r, col.g, texture2D(uTex,duv-vec2(ca,0.)).b);
    vec3 tint = mix(vec3(0.07,0.12,0.24), vec3(0.80,0.92,1.0), smoothstep(0.05,0.85,L));
    vec3 glass = mix(tint, g*vec3(0.82,0.94,1.12), 0.5);
    o = glass*(0.5+0.65*diff) + spec*vec3(0.92,0.97,1.0)*1.6 + fres*vec3(0.45,0.7,1.0)*0.65 + smoothstep(0.8,1.,L)*vec3(0.9,0.97,1.0)*0.8; }
  else if(M==6){ float au = fbm(duv*3.0+vec2(t*0.15,-t*0.25)); vec3 aur = pal(au+L*0.5+t*0.05, vec3(0.1,0.3,0.3), vec3(0.2,0.4,0.4), vec3(1.,1.,1.), vec3(0.3,0.5,0.8));
    float stars = step(0.995, hash(floor(duv*400.0)))*(0.5+0.5*sin(t*3.0+duv.x*50.0));
    o = rgb*0.2 + aur*(0.5+0.7*diff)*1.3 + stars*vec3(1.) + smoothstep(0.7,1.,L)*aur*0.5; }
  else if(M==7){ float env = clamp(n.y*0.5+0.5 + fbm(duv*2.0)*0.3,0.,1.); vec3 chrome = mix(vec3(0.05,0.06,0.09), vec3(0.9,0.93,1.0), env);
    o = chrome*(0.4+0.7*diff) + spec*vec3(1.)*2.5 + fres*vec3(0.8,0.85,0.95); o = mix(o, vec3(lum(o)), 0.5); }
  else if(M==8){ float goo = fbm(duv*4.5+vec2(-t*0.3,t*0.4)); float bub = smoothstep(0.6,0.75,goo); vec3 tox = mix(vec3(0.05,0.2,0.02), vec3(0.5,1.0,0.1), clamp(L+goo*0.4,0.,1.));
    o = tox*(0.35+0.7*diff) + bub*vec3(0.6,1.,0.3)*1.2 + smoothstep(0.7,1.,goo)*vec3(0.7,1.,0.2)*1.5 + fres*vec3(0.5,1.,0.2)*0.6; }
  else if(M==9){ float ca = 0.004; vec3 holo = vec3(texture2D(uTex,duv+vec2(ca,0.)).r, col.g, texture2D(uTex,duv-vec2(ca,0.)).b);
    holo = mix(holo, vec3(0.2,0.9,1.0)*lum(holo)*2.0, 0.7); float scan = 0.7+0.3*sin((duv.y*uRes.y*1.2)-t*8.0); float flick = 0.85+0.15*sin(t*20.0);
    o = holo*scan*flick*(0.5+0.6*diff) + fres*vec3(0.3,0.9,1.0)*1.5 + smoothstep(0.6,1.,L)*vec3(0.4,1.,1.)*0.6; }
  gl_FragColor = vec4(o, 1.0);
}`;

let G = null; // shared context: { canvas, gl, tex, u, size }
function ensure(size) {
  if (G && G.size === size) return G;
  let c, gl;
  try {
    c = document.createElement("canvas"); c.width = c.height = size;
    gl = c.getContext("webgl", { premultipliedAlpha: false, preserveDrawingBuffer: true }) ||
         c.getContext("experimental-webgl", { premultipliedAlpha: false, preserveDrawingBuffer: true });
  } catch (e) { return null; }
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const pLoc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(pLoc); gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const u = { time: gl.getUniformLocation(prog, "uTime"), res: gl.getUniformLocation(prog, "uRes"), mode: gl.getUniformLocation(prog, "uMode"), transparentBg: gl.getUniformLocation(prog, "uTransparentBg") };
  gl.uniform2f(u.res, 1024, 1024); // match the approved lab (UV-space steps are resolution-independent)
  G = { canvas: c, gl, tex, u, size };
  return G;
}

// Render the effect for a machine texture (any-size canvas, sampled in UV) into the shared SQUARE GL canvas.
// Returns the size×size GL canvas (drawImage-able) or null if the key isn't a WebGL effect / no WebGL.
export function renderWebglEffect(machineCanvas, size, key, time, transparentBg) {
  const mode = FX_MODE[key];
  if (!mode) return null; // plain / unknown / legacy 2D effect
  let g; try { g = ensure(size); } catch (e) { return null; }
  if (!g) return null;
  const gl = g.gl;
  try {
    gl.bindTexture(gl.TEXTURE_2D, g.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, machineCanvas);
    gl.viewport(0, 0, size, size);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(g.u.time, time == null ? performance.now() / 1000 : time);
    gl.uniform1i(g.u.mode, mode);
    gl.uniform1i(g.u.transparentBg, transparentBg ? 1 : 0); // 1 = transparent backdrop (stack over a background); 0 = dark fill (replace scene)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return g.canvas;
  } catch (e) { return null; }
}

// In-place post-pass over a SQUARE ctx: the machine is already on `ctx` (transparent) → replace with the effect.
// transparentBg=true keeps the non-machine pixels transparent so a background behind it stays visible.
export function applyWebglEffect(ctx, size, key, time, transparentBg) {
  const out = renderWebglEffect(ctx.canvas, size, key, time, transparentBg);
  if (!out) return false;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(out, 0, 0, size, size);
  return true;
}
