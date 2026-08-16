// webgl-bg.js — shared WebGL animated-background renderer (Tier-3 crate). The 12 scenes are ported VERBATIM
// from the approved bg-lab.html, but main() outputs JUST the procedural scene (no machine composite) so the
// caller can layer: background scene → behind items → effected machine on top (effect + background STACK).
//
// renderBackground(size, key, time) → an opaque size×size canvas with the animated scene.

export const BG_MODE = { nebula: 8, blackhole: 3, waterfall: 1, leaves: 2, wolf: 4, moon: 5, aurora: 6, rain: 7, butterflies: 9, flowers: 10, confetti: 11, rainbow: 12 };
// on-chain partId → background key. Backgrounds occupy partIds 13-24 — a SEPARATE slot from effects (4-12).
export const BG_PART_KEYS = { 13: "nebula", 14: "blackhole", 15: "waterfall", 16: "leaves", 17: "wolf", 18: "moon", 19: "aurora", 20: "rain", 21: "butterflies", 22: "flowers", 23: "confetti", 24: "rainbow" };
export const BG_KEYS = new Set(Object.values(BG_PART_KEYS));
export const isBackground = (key) => BG_KEYS.has(key);

const VS = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = vec2(p.x*0.5+0.5, 0.5-p.y*0.5); gl_Position = vec4(p,0.,1.); }`;
const FS = `precision highp float;
uniform float uTime; uniform vec2 uRes; uniform int uMode;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<6;i++){ v+=a*noise(p); p=p*2.03+1.7; a*=.5; } return v; }
mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float star(vec2 uv, float dens){ vec2 p=uv*dens; vec2 g=floor(p); vec2 f=fract(p)-0.5; float h=hash(g);
  float present=step(0.93,h); vec2 c=(vec2(hash(g+0.1),hash(g+0.2))-0.5)*0.7; float d=length(f-c);
  float tw=0.7+0.3*sin(uTime*2.5+h*40.0); return present*smoothstep(0.16,0.0,d)*tw; }
vec3 bg(vec2 uv){
  float t=uTime; float asp=uRes.x/uRes.y; vec2 c=(uv-0.5); c.x*=asp; int M=uMode;
  vec3 col=vec3(0.02,0.03,0.05);
  if(M==1){
    col = mix(vec3(0.02,0.13,0.17), vec3(0.05,0.30,0.36), uv.y);
    float w = fbm(vec2(uv.x*10.0, uv.y*5.0 - t*2.2));
    float streak = fbm(vec2(uv.x*44.0, uv.y*3.0 - t*4.5));
    col += vec3(0.10,0.36,0.46)*w*0.8;
    col += vec3(0.55,0.82,0.92)*smoothstep(0.6,0.92,streak)*0.7;
    float foam = fbm(vec2(uv.x*8.0+t, uv.y*9.0 - t*1.6));
    col += vec3(0.85,0.96,1.0)*smoothstep(0.78,0.15,uv.y)*foam*0.6;
  } else if(M==2){
    col = mix(vec3(0.95,0.72,0.42), vec3(0.66,0.46,0.28), uv.y);
    for(int i=0;i<16;i++){ float fi=float(i);
      float sp=0.12+hash(vec2(fi,1.0))*0.22;
      vec2 lp=vec2(fract(hash(vec2(fi,2.0))+t*sp), hash(vec2(fi,3.0))*0.62 + sin(t*1.6+fi)*0.05);
      vec2 d=(uv-lp); d.x*=asp; d=rot(t*2.2+fi)*d;
      float leaf=smoothstep(0.018,0.0, abs(d.x)*2.2+abs(d.y));
      vec3 lc=mix(vec3(0.85,0.32,0.08), vec3(0.92,0.72,0.10), hash(vec2(fi,4.0)));
      col=mix(col, lc, leaf*0.9);
    }
  } else if(M==3){
    vec2 bp=vec2(0.24,0.22); vec2 q=(uv-bp); q.x*=asp; float r=length(q); float R=0.07;
    float bend=0.035/(r+0.03); vec2 sp=(uv-bp)*(1.0-bend)+bp; col=vec3(star(sp*vec2(asp,1.0),75.0));
    float ang=atan(q.y,q.x); float sw=0.65+0.35*sin(ang*5.0 - t*3.0);
    vec3 hot = mix(vec3(1.0,0.97,0.82), vec3(1.0,0.40,0.06), smoothstep(R,0.22,r));
    float halo = exp(-pow((r-R*1.2)/0.024,2.0));
    float dd = length(vec2(q.x, q.y/0.20));
    float disk = smoothstep(0.24,R*1.05,dd)*smoothstep(R*0.85,R*1.15,dd);
    col += hot*(halo*1.5 + disk*1.1)*(0.7+0.5*sw)*2.1;
    col += vec3(1.0,0.92,0.75)*exp(-pow((r-R)/0.006,2.0))*2.2;
    col *= smoothstep(R*0.9,R,r);
  } else if(M==4){
    col=mix(vec3(0.03,0.04,0.09), vec3(0.06,0.08,0.15), uv.y);
    col += vec3(star(uv*vec2(asp,1.0),50.0))*0.5;
    col += vec3(0.05,0.07,0.11)*fbm(vec2(uv.x*3.0+t*0.1, uv.y*3.0))*0.6;
    float tree = 0.72 + (fbm(vec2(uv.x*7.0,0.0))-0.5)*0.16;
    col = mix(col, vec3(0.0), step(tree, uv.y));
    for(int i=0;i<4;i++){ float fi=float(i);
      vec2 ep=vec2(0.18+0.21*fi, tree+0.05+hash(vec2(fi,5.0))*0.1);
      float blink=step(0.12, fract(t*0.5+hash(vec2(fi,6.0))));
      for(int e=0;e<2;e++){ vec2 eo=vec2((float(e)-0.5)*0.028,0.0);
        float d=length((uv-ep-eo)*vec2(asp,1.0));
        col += vec3(1.0,0.82,0.2)*smoothstep(0.013,0.0,d)*blink*1.6;
      }
    }
  } else if(M==5){
    col=mix(vec3(0.02,0.03,0.10), vec3(0.0,0.0,0.02), uv.y);
    col += vec3(star(uv*vec2(asp,1.0),55.0))*0.6;
    vec2 mp=vec2(0.78,0.22); float md=length((uv-mp)*vec2(asp,1.0));
    float moon=smoothstep(0.135,0.128,md); float cr=fbm((uv-mp)*32.0);
    col=mix(col, mix(vec3(0.82,0.84,0.78), vec3(0.58,0.60,0.56), cr)*moon, moon);
    col += vec3(0.4,0.45,0.62)*smoothstep(0.24,0.135,md)*0.4;
    float cl=fbm(vec2(uv.x*4.0 - t*0.14, uv.y*6.0));
    col += vec3(0.10,0.12,0.20)*smoothstep(0.55,0.78,cl)*0.7;
  } else if(M==6){
    col=mix(vec3(0.02,0.02,0.07), vec3(0.0,0.01,0.03), uv.y);
    col += vec3(star(uv*vec2(asp,1.0),55.0))*0.5;
    for(int i=0;i<3;i++){ float fi=float(i);
      float base=0.34+fi*0.09 + sin(uv.x*3.0+t*0.6+fi)*0.06 + (fbm(vec2(uv.x*4.0+t*0.2,fi))-0.5)*0.14;
      float band=smoothstep(0.11,0.0, abs(uv.y-base));
      vec3 ac=mix(vec3(0.1,0.9,0.45), vec3(0.6,0.2,0.9), 0.5+0.5*sin(uv.x*5.0+t+fi));
      col += ac*band*0.55;
    }
  } else if(M==7){
    col=mix(vec3(0.07,0.08,0.11), vec3(0.02,0.03,0.05), uv.y);
    float rx=uv.x*90.0; float rain=0.0;
    for(int i=0;i<2;i++){ float off=float(i)*0.5;
      float y=fract(uv.y*3.0 - t*3.2 + hash(vec2(floor(rx),off))*10.0 + off);
      rain += smoothstep(0.0,0.04,y)*smoothstep(0.22,0.04,y)*step(0.72, hash(vec2(floor(rx),off)));
    }
    col += vec3(0.5,0.6,0.8)*rain*0.6;
    float flash=smoothstep(0.985,1.0, 0.5+0.5*sin(t*0.7)+ (fbm(vec2(t,0.0))-0.5)*0.5);
    col += vec3(0.6,0.7,0.9)*flash*0.5;
  } else if(M==9){
    col = mix(vec3(0.72,0.90,0.98), vec3(0.99,0.94,0.78), uv.y);
    for(int i=0;i<12;i++){ float fi=float(i);
      float sp=0.09+hash(vec2(fi,1.0))*0.14;
      vec2 bpp=vec2(fract(hash(vec2(fi,2.0))+t*sp), hash(vec2(fi,3.0))*0.82 + sin(t*2.0+fi)*0.05);
      vec2 d=(uv-bpp); d.x*=asp; float flap=0.006+abs(sin(t*9.0+fi*2.0))*0.013;
      float wl=smoothstep(0.016,0.0, length((d-vec2(-flap,0.0))*vec2(1.0,1.5)));
      float wr=smoothstep(0.016,0.0, length((d-vec2( flap,0.0))*vec2(1.0,1.5)));
      vec3 bc=0.55+0.45*cos(6.2831*(hash(vec2(fi,4.0))+vec3(0.0,0.33,0.67)));
      col=mix(col, bc, max(wl,wr)*0.9);
      col=mix(col, vec3(0.1,0.08,0.06), smoothstep(0.004,0.0, length(d*vec2(3.0,1.0)))*0.7);
    }
  } else if(M==10){
    col = mix(vec3(0.55,0.80,0.98), vec3(0.88,0.96,1.0), smoothstep(0.0,0.6,uv.y));
    col = mix(col, vec3(0.35,0.66,0.26), smoothstep(0.56,0.63,uv.y));
    for(int i=0;i<26;i++){ float fi=float(i);
      vec2 fp=vec2(hash(vec2(fi,1.0)) + sin(t*1.6+fi)*0.006, 0.62+hash(vec2(fi,2.0))*0.34);
      vec2 d=(uv-fp); d.x*=asp; float dist=length(d);
      float petals=0.6+0.4*cos(atan(d.y,d.x)*5.0);
      float flower=smoothstep(0.028*(0.6+petals*0.5),0.0,dist);
      vec3 fc=0.55+0.45*cos(6.2831*(hash(vec2(fi,3.0))+vec3(0.0,0.33,0.67)));
      col=mix(col, fc, flower*0.9);
      col=mix(col, vec3(1.0,0.9,0.3), smoothstep(0.006,0.0,dist));
    }
  } else if(M==11){
    col = mix(vec3(0.14,0.09,0.24), vec3(0.26,0.16,0.36), uv.y);
    for(int i=0;i<30;i++){ float fi=float(i);
      float sp=0.15+hash(vec2(fi,1.0))*0.25;
      vec2 cp=vec2(hash(vec2(fi,2.0))+sin(t*2.0+fi)*0.04, fract(hash(vec2(fi,3.0))-t*sp));
      vec2 d=(uv-cp); d.x*=asp; d=rot(t*3.0+fi)*d;
      float piece=step(abs(d.x),0.008)*step(abs(d.y),0.014);
      vec3 cc=0.5+0.5*cos(6.2831*(hash(vec2(fi,4.0))+vec3(0.0,0.33,0.67)));
      col=mix(col, cc, piece);
    }
  } else if(M==12){
    col = mix(vec3(1.0), 0.75+0.25*cos(6.2831*(uv.y*1.2+vec3(0.0,0.2,0.4))), 0.6);
    vec2 rc=vec2(0.5,1.05); float rr=length((uv-rc)*vec2(asp,1.0));
    vec3 rainbow=0.5+0.5*cos(6.2831*(rr*3.5+vec3(0.0,0.33,0.67)));
    float arc=smoothstep(0.60,0.58,rr)*smoothstep(0.42,0.44,rr);
    col=mix(col, rainbow, arc*0.75);
    float cl=fbm(vec2(uv.x*4.0-t*0.05, uv.y*5.0));
    col=mix(col, vec3(1.0), smoothstep(0.58,0.78,cl)*0.6);
  } else {
    vec2 q=uv*2.0+vec2(t*0.02,-t*0.015); float n=fbm(q*2.0), n2=fbm(q*4.0+n);
    vec3 neb=mix(vec3(0.10,0.02,0.22), vec3(0.6,0.1,0.5), n);
    neb=mix(neb, vec3(0.10,0.30,0.7), n2*0.6);
    col=neb*(0.4+0.8*n2);
    col += vec3(star(uv*vec2(asp,1.0),80.0));
    col += vec3(1.0,0.9,0.8)*pow(star(uv*vec2(asp,1.0),30.0),2.0);
  }
  return col;
}
void main(){
  vec3 scene = bg(vUv);
  float sh = smoothstep(0.33,0.0, length((vUv-vec2(0.5,0.93))*vec2(1.0,3.2))); // soft contact shadow under the machine
  scene *= (1.0 - sh*0.45);
  gl_FragColor = vec4(scene, 1.0);
}`;

let G = null; // { canvas, gl, u, size }
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
  const u = { time: gl.getUniformLocation(prog, "uTime"), res: gl.getUniformLocation(prog, "uRes"), mode: gl.getUniformLocation(prog, "uMode") };
  gl.uniform2f(u.res, 1024, 1024);
  G = { canvas: c, gl, u, size };
  return G;
}

// Render the animated scene for a background key into the shared GL canvas; returns it (opaque) or null.
export function renderBackground(size, key, time) {
  const mode = BG_MODE[key];
  if (!mode) return null;
  let g; try { g = ensure(size); } catch (e) { return null; }
  if (!g) return null;
  const gl = g.gl;
  try {
    gl.viewport(0, 0, size, size);
    gl.uniform1f(g.u.time, time == null ? performance.now() / 1000 : time);
    gl.uniform1i(g.u.mode, mode);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return g.canvas;
  } catch (e) { return null; }
}
