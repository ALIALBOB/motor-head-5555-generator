// webgl-bg.js — shared WebGL animated-background renderer (Tier-3 crate). The 12 scenes are ported VERBATIM
// from the approved bg-lab.html, but main() outputs JUST the procedural scene (no machine composite) so the
// caller can layer: background scene → behind items → effected machine on top (effect + background STACK).
//
// renderBackground(size, key, time) → an opaque size×size canvas with the animated scene.

export const BG_MODE = {
  // Vol. 1 (partIds 13-24)
  nebula: 8, blackhole: 3, waterfall: 1, leaves: 2, wolf: 4, moon: 5, aurora: 6, rain: 7, butterflies: 9, flowers: 10, confetti: 11, rainbow: 12,
  // Vol. 2 (partIds 25-36) — shader modes 13-24
  aquarium: 13, synthwave: 14, matrix: 15, koi: 16, lofirain: 17, jellyfish: 18, warp: 19, fireflies: 20, sakura: 21, lavalamp: 22, snow: 23, neoncity: 24,
};
// on-chain partId → background key. Backgrounds occupy partIds 13-36 — a SEPARATE slot from effects (1-12).
export const BG_PART_KEYS = {
  13: "nebula", 14: "blackhole", 15: "waterfall", 16: "leaves", 17: "wolf", 18: "moon", 19: "aurora", 20: "rain", 21: "butterflies", 22: "flowers", 23: "confetti", 24: "rainbow",
  25: "aquarium", 26: "synthwave", 27: "matrix", 28: "koi", 29: "lofirain", 30: "jellyfish", 31: "warp", 32: "fireflies", 33: "sakura", 34: "lavalamp", 35: "snow", 36: "neoncity",
};
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
  } else if(M==13){ // PIXEL AQUARIUM
    float PX=84.0; vec2 pv=(floor(uv*PX)+0.5)/PX;
    col = mix(vec3(0.06,0.44,0.56), vec3(0.02,0.10,0.30), pv.y);
    float ca=fbm(vec2(pv.x*7.0, pv.y*7.0 - t*0.6));
    col += vec3(0.20,0.50,0.55)*smoothstep(0.62,0.92,ca)*(1.0-pv.y)*0.5;
    col = mix(col, vec3(0.82,0.73,0.46), smoothstep(0.88,0.92,pv.y));
    for(int i=0;i<10;i++){ float fi=float(i);
      vec2 bp=vec2(hash(vec2(fi,7.0)), fract(hash(vec2(fi,8.0)) - t*(0.05+hash(vec2(fi,9.0))*0.06)));
      float d=length((pv-bp)*vec2(asp,1.0));
      col += vec3(0.75,0.92,1.0)*smoothstep(0.011,0.006,d)*0.5; }
    for(int i=0;i<6;i++){ float fi=float(i);
      float dir = mod(fi,2.0)<0.5 ? 1.0 : -1.0;
      float sp=0.05+hash(vec2(fi,1.0))*0.08;
      float fx=fract(hash(vec2(fi,2.0)) + t*sp*dir);
      float fy=0.14 + hash(vec2(fi,3.0))*0.66;
      vec2 d=(pv-vec2(fx,fy)); d.x*=asp; d.x*=dir;
      float body=smoothstep(0.045,0.028,length(d*vec2(1.0,2.0)));
      float tail=step(d.x,-0.028)*step(-0.058,d.x)*step(abs(d.y),(d.x+0.062)*0.9);
      vec3 fc=0.55+0.45*cos(6.2831*(hash(vec2(fi,4.0))+vec3(0.0,0.33,0.67)));
      col=mix(col, fc, clamp(body+tail,0.0,1.0));
      col=mix(col, vec3(0.05), smoothstep(0.008,0.0, length(d-vec2(0.028,-0.006)))); }
  } else if(M==14){ // SYNTHWAVE SUNSET
    float hz=0.60;
    col = mix(vec3(0.22,0.03,0.38), vec3(1.0,0.36,0.46), smoothstep(0.0,hz,uv.y));
    col += vec3(star(uv*vec2(asp,1.0),60.0))*smoothstep(hz,0.0,uv.y)*0.6;
    vec2 sc=vec2(0.5,hz-0.03); vec2 sd=(uv-sc); sd.x*=asp;
    float sun=smoothstep(0.22,0.205,length(sd));
    vec3 sunCol=mix(vec3(1.0,0.92,0.35), vec3(1.0,0.22,0.52), smoothstep(-0.2,0.2,sd.y));
    float sg=step(0.0,sd.y)*step(0.5, fract(sd.y*46.0));
    sun*=(1.0-sg);
    col=mix(col, sunCol, sun);
    if(uv.y>hz){
      float fy=(uv.y-hz)/(1.0-hz);
      float hy=fract(1.0/(fy+0.05)*0.7 - t*0.9);
      float hl=smoothstep(0.10,0.0,abs(hy-0.5));
      float vx=(uv.x-0.5)/(fy*fy+0.04);
      float vl=smoothstep(0.09,0.0,abs(fract(vx*3.0)-0.5));
      vec3 grid=vec3(0.95,0.2,0.85)*hl + vec3(0.2,0.95,1.0)*vl;
      vec3 fl=mix(vec3(0.12,0.02,0.22), vec3(0.02,0.0,0.06), fy);
      col=fl + grid*(0.35+0.65*(1.0-fy));
    }
    col *= 0.92+0.08*sin(uv.y*uRes.y*0.7);
  } else if(M==15){ // MATRIX RAIN
    col=vec3(0.0,0.02,0.01);
    float cols=42.0; float cx=floor(uv.x*cols);
    float sp=0.4+hash(vec2(cx,1.0))*1.4;
    float head=fract(hash(vec2(cx,2.0)) + t*sp*0.25);
    float d=fract(head - uv.y);
    float g=step(0.45, hash(vec2(cx, floor(uv.y*34.0) - floor(t*9.0*sp))));
    col += vec3(0.10,1.0,0.28)*exp(-d*5.0)*g*1.2;
    col += vec3(0.85,1.0,0.9)*smoothstep(0.05,0.0,d)*g;
  } else if(M==16){ // KOI POND (top-down)
    col=mix(vec3(0.03,0.15,0.13), vec3(0.02,0.08,0.10), fbm(uv*3.0+t*0.05));
    col += vec3(0.05,0.20,0.18)*fbm(uv*6.0+vec2(sin(t*0.3),cos(t*0.4)))*0.5;
    for(int i=0;i<3;i++){ float fi=float(i);
      vec2 rc=vec2(hash(vec2(fi,5.0)),hash(vec2(fi,6.0)));
      float rt=fract(t*0.22+fi*0.33);
      float rr=length((uv-rc)*vec2(asp,1.0));
      col += vec3(0.4,0.6,0.6)*smoothstep(0.02,0.0,abs(rr-rt*0.42))*(1.0-rt)*0.4; }
    for(int i=0;i<4;i++){ float fi=float(i);
      float a=t*(0.10+hash(vec2(fi,1.0))*0.08)+fi*1.6;
      vec2 kc=vec2(0.5+cos(a)*0.30, 0.5+sin(a*0.8)*0.30);
      vec2 d=(uv-kc); d.x*=asp; d=rot(a+1.57)*d;
      float body=smoothstep(0.06,0.028,length(d*vec2(0.6,1.8)));
      vec3 kcol = hash(vec2(fi,4.0))<0.5 ? vec3(1.0,0.46,0.12) : vec3(1.0,1.0,1.0);
      col=mix(col,kcol,body*0.92);
      col=mix(col, vec3(0.92,0.2,0.05), smoothstep(0.02,0.0,length(d-vec2(0.0,0.03)))*0.6); }
  } else if(M==17){ // RAINY WINDOW (lofi)
    col=mix(vec3(0.08,0.07,0.14), vec3(0.17,0.11,0.15), uv.y);
    for(int i=0;i<9;i++){ float fi=float(i);
      vec2 bp=vec2(hash(vec2(fi,1.0)), hash(vec2(fi,2.0))*0.78);
      float d=length((uv-bp)*vec2(asp,1.0));
      vec3 bc=0.55+0.45*cos(6.2831*(hash(vec2(fi,3.0))+vec3(0.0,0.28,0.55)));
      bc=mix(bc, vec3(1.0,0.72,0.38), 0.4);
      col += bc*smoothstep(0.15,0.0,d)*0.55; }
    float rx=uv.x*40.0; float rc=floor(rx);
    float streak=smoothstep(0.40,0.0,abs(fract(rx)-0.5))*step(0.55,hash(vec2(rc,3.0)));
    float ry=fract(uv.y*1.6 - t*(0.9+hash(vec2(rc,4.0))*1.3));
    col += vec3(0.6,0.68,0.85)*streak*smoothstep(0.0,0.25,ry)*smoothstep(1.0,0.30,ry)*0.5;
    for(int i=0;i<16;i++){ float fi=float(i);
      float dx=hash(vec2(fi,6.0)); float dy=fract(hash(vec2(fi,7.0)) + t*0.12*(0.5+hash(vec2(fi,8.0))));
      vec2 d=(uv-vec2(dx,dy)); d.x*=asp;
      col += vec3(0.72,0.8,0.92)*smoothstep(0.012,0.005,length(d))*0.6;
      col += vec3(0.5,0.58,0.72)*smoothstep(0.006,0.0,abs(d.x))*smoothstep(0.05,0.0,d.y)*step(0.0,d.y)*0.25; }
    col *= 1.0 - 0.42*length(uv-0.5);
  } else if(M==18){ // JELLYFISH
    col=mix(vec3(0.02,0.05,0.15), vec3(0.0,0.0,0.03), uv.y);
    col += vec3(0.3,0.6,0.75)*pow(star(uv*vec2(asp,1.0),42.0),2.0)*0.9;
    for(int i=0;i<3;i++){ float fi=float(i);
      float jx=0.24+fi*0.26 + sin(t*0.5+fi)*0.05;
      float jy=fract(hash(vec2(fi,2.0)) - t*0.05);
      vec2 d=(uv-vec2(jx,jy)); d.x*=asp;
      float pulse=0.05+0.010*sin(t*3.0+fi*2.0);
      vec3 jc=mix(vec3(0.3,0.9,1.0), vec3(0.85,0.4,1.0), hash(vec2(fi,3.0)));
      float bd=length(d*vec2(1.0,1.35));
      float bell=smoothstep(pulse,pulse-0.014,bd)*smoothstep(0.035,-0.02,d.y);
      col += jc*bell*0.8;
      col += jc*smoothstep(pulse*1.9,0.0,bd)*0.12;
      float tent=0.0;
      for(int k=0;k<4;k++){ float fk=float(k);
        float xoff=(fk-1.5)*0.016;
        float wav=sin(d.y*22.0+t*4.0+fk*1.7)*0.012*smoothstep(0.0,0.08,d.y);
        tent += smoothstep(0.0035,0.0, abs(d.x-xoff-wav))*smoothstep(0.20,0.0,d.y)*step(0.0,d.y); }
      col += jc*tent*0.4; }
  } else if(M==19){ // HYPERSPACE WARP
    vec2 hc=(uv-0.5); hc.x*=asp; float ang=atan(hc.y,hc.x); float r=length(hc);
    col=vec3(0.0,0.0,0.02);
    for(int i=0;i<64;i++){ float fi=float(i);
      float sa=hash(vec2(fi,1.0))*6.2831;
      float base=fract(hash(vec2(fi,2.0)) + t*(0.25+hash(vec2(fi,3.0))*0.5));
      float dang=mod(ang-sa+9.4247, 6.2831)-3.1416;
      float angW=smoothstep(0.02,0.0, abs(dang)*max(r,0.05));
      float len=0.12*base+0.02;
      float rad=smoothstep(0.0,0.015, r-base*0.75)*smoothstep(len,0.0, r-base*0.75);
      col += vec3(0.75,0.85,1.0)*angW*rad*(0.4+base); }
    col += vec3(0.6,0.8,1.0)*smoothstep(0.18,0.0,r)*0.6;
  } else if(M==20){ // FIREFLIES FOREST
    col=mix(vec3(0.02,0.07,0.05), vec3(0.0,0.02,0.02), uv.y);
    col += vec3(0.03,0.06,0.05)*fbm(vec2(uv.x*3.0+t*0.05,uv.y*3.0))*0.7;
    float tree=0.66+(fbm(vec2(uv.x*8.0,1.0))-0.5)*0.22;
    col=mix(col, vec3(0.0,0.012,0.0), smoothstep(tree,tree+0.02,uv.y));
    for(int i=0;i<16;i++){ float fi=float(i);
      vec2 fp=vec2(hash(vec2(fi,1.0))+sin(t*0.6+fi)*0.04, hash(vec2(fi,2.0))*0.75+cos(t*0.5+fi*1.3)*0.03);
      float d=length((uv-fp)*vec2(asp,1.0));
      float blink=0.5+0.5*sin(t*3.0+fi*2.0);
      col += vec3(1.0,0.9,0.3)*smoothstep(0.020,0.0,d)*blink;
      col += vec3(0.85,0.72,0.2)*smoothstep(0.055,0.0,d)*blink*0.22; }
  } else if(M==21){ // SAKURA DRIFT
    col=mix(vec3(0.52,0.42,0.66), vec3(0.99,0.76,0.70), uv.y);
    col += vec3(0.08)*fbm(uv*3.0+t*0.05);
    for(int i=0;i<26;i++){ float fi=float(i);
      float sp=0.05+hash(vec2(fi,1.0))*0.08;
      vec2 pp=vec2(fract(hash(vec2(fi,2.0)) + t*sp*0.5 + sin(t+fi)*0.02), fract(hash(vec2(fi,3.0)) + t*sp));
      vec2 d=(uv-pp); d.x*=asp; d=rot(t*2.0+fi)*d;
      float petal=smoothstep(0.014,0.0, length(d*vec2(1.0,1.7)));
      vec3 pc=mix(vec3(1.0,0.76,0.86), vec3(1.0,0.6,0.76), hash(vec2(fi,4.0)));
      col=mix(col,pc,petal*0.9); }
  } else if(M==22){ // LAVA LAMP
    col=mix(vec3(0.16,0.02,0.10), vec3(0.36,0.05,0.02), uv.y);
    float field=0.0;
    for(int i=0;i<7;i++){ float fi=float(i);
      vec2 bp=vec2(0.5+sin(t*(0.3+hash(vec2(fi,1.0))*0.3)+fi*2.0)*0.30,
                   fract(hash(vec2(fi,2.0)) + sin(t*0.2+fi)*0.25 - t*0.04));
      float d=length((uv-bp)*vec2(asp,1.0));
      field += 0.02/(d*d+0.004); }
    float blob=smoothstep(1.0,2.2,field);
    vec3 lava=mix(vec3(1.0,0.5,0.0), vec3(1.0,0.86,0.25), smoothstep(2.0,4.0,field));
    col=mix(col, lava, blob);
    col += lava*smoothstep(0.85,1.2,field)*0.25;
  } else if(M==23){ // SNOWFALL NIGHT
    col=mix(vec3(0.04,0.06,0.17), vec3(0.10,0.13,0.25), uv.y);
    vec2 mp=vec2(0.75,0.22); float md=length((uv-mp)*vec2(asp,1.0));
    col += vec3(0.6,0.65,0.8)*smoothstep(0.3,0.0,md)*0.4;
    col = mix(col, vec3(0.9,0.92,1.0), smoothstep(0.09,0.084,md));
    float pl=0.72 - abs(fract(uv.x*8.0)-0.5)*0.22;
    col=mix(col, vec3(0.02,0.04,0.09), smoothstep(pl,pl+0.01,uv.y));
    for(int L=0;L<3;L++){ float fl=float(L);
      float sc=30.0+fl*22.0;
      vec2 sp=vec2(uv.x*sc + sin(uv.y*10.0+t)*0.5, uv.y*sc + t*(2.0+fl*1.5));
      vec2 g=floor(sp); vec2 f=fract(sp)-0.5;
      float flake=step(0.86,hash(g+fl*10.0))*smoothstep(0.32,0.0,length(f));
      col += vec3(1.0)*flake*(0.5+0.25*fl); }
  } else if(M==24){ // NEON CITY RAIN
    col=mix(vec3(0.05,0.03,0.12), vec3(0.13,0.05,0.17), uv.y);
    col += vec3(0.9,0.15,0.55)*smoothstep(0.45,0.72,uv.y)*smoothstep(0.96,0.72,uv.y)*0.42;
    col += vec3(0.1,0.6,0.9)*smoothstep(0.52,0.72,uv.y)*0.15;
    float bcell=floor(uv.x*8.0);
    float bh=0.40+hash(vec2(bcell,1.0))*0.34; float roof=0.74-bh;
    float inB=step(roof,uv.y);
    col=mix(col, vec3(0.02,0.02,0.05)*(0.7+hash(vec2(bcell,9.0))*0.3), inB);
    float wxg=floor(uv.x*40.0), wy=floor(uv.y*44.0);
    float lit=step(0.80,hash(vec2(wxg,wy)))*inB*step(roof+0.01,uv.y);
    vec3 wc=mix(vec3(1.0,0.8,0.42), vec3(0.4,0.9,1.0), step(0.5,hash(vec2(wxg,wy+3.0))));
    float cellx=step(0.25,fract(uv.x*40.0))*step(fract(uv.x*40.0),0.75);
    float celly=step(0.2,fract(uv.y*44.0))*step(fract(uv.y*44.0),0.8);
    col += wc*lit*cellx*celly*0.9;
    float rx=uv.x*70.0; float rain=0.0;
    for(int i=0;i<2;i++){ float off=float(i)*0.5;
      float y=fract(uv.y*2.2 - t*3.2 + hash(vec2(floor(rx),off))*10.0+off);
      rain += smoothstep(0.0,0.06,y)*smoothstep(0.3,0.06,y)*step(0.80,hash(vec2(floor(rx),off))); }
    col += vec3(0.5,0.6,0.8)*rain*0.3;
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
