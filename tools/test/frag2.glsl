precision highp float; varying vec2 vUv;
 uniform sampler2D tScene; uniform vec2 uFocus; uniform float uAspect,uFocusOn,uExposure;
 uniform float uTime,uBase,uHit,uDamage,uLow,uSlow,uSpeed,uSolar,uBoost,uFlash,uShield,uBH,uGrav,uAnom,uLeg; uniform vec3 uHitCol;
 const float PI=3.14159265;
 const mat3 ACESIn=mat3(vec3(0.59719,0.07600,0.02840),vec3(0.35458,0.90834,0.13383),vec3(0.04823,0.01566,0.83777));
 const mat3 ACESOut=mat3(vec3(1.60475,-0.10208,-0.00327),vec3(-0.53108,1.10813,-0.07276),vec3(-0.07367,-0.00605,1.07602));
 vec3 aces(vec3 c){ c*=uExposure/0.6; c=ACESIn*c; vec3 a=c*(c+0.0245786)-0.000090537; vec3 b=c*(0.983729*c+0.4329510)+0.238081; c=ACESOut*(a/b); return clamp(c,0.0,1.0); }
 vec3 toSRGB(vec3 c){ return mix(c*12.92,1.055*pow(c,vec3(0.4166667))-0.055,step(vec3(0.0031308),c)); }
 void over(inout vec3 c,inout float a,vec3 col,float al){ al=clamp(al,0.0,1.0); c=col*al+c*(1.0-al); a=al+a*(1.0-al); }
 void main(){
  vec2 uv=vUv; vec2 ctr=vec2(0.5,0.5);
  /* ---- hyperdrive radial motion blur (ship stays sharp) ---- */
  vec2 dv=(uv-uFocus)*vec2(uAspect,1.0);
  float fm=mix(1.0,smoothstep(0.09,0.30,length(dv)),uFocusOn);
  float edge=smoothstep(0.06,0.60,length((uv-ctr)*vec2(uAspect*0.6,1.0)));
  float k=0.20*uBoost*edge*fm;
  vec3 col;
  if(k>0.003){
   float j=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
   vec3 acc=vec3(0.0); float ws=0.0;
   for(int i=0;i<10;i++){ float t=(float(i)+j)/10.0; float w=1.0-t*0.5; acc+=texture2D(tScene,uv+(ctr-uv)*(t*k)).rgb*w; ws+=w; }
   col=acc/ws;
   float ca=k*0.07; col.r=mix(col.r,texture2D(tScene,uv+(ctr-uv)*ca).r,0.55); col.b=mix(col.b,texture2D(tScene,uv-(ctr-uv)*ca).b,0.55);
   col*=1.0+uBoost*0.18*edge;
  } else col=texture2D(tScene,uv).rgb;
  vec3 base=toSRGB(aces(col));
  /* ---- overlays (display space) ---- */
  vec3 c=vec3(0.0); float a=0.0;
  float dC=length((uv-vec2(0.5,0.5))/0.7071);
  float dB=length((uv-vec2(0.5,0.46))/0.7071);
  float dS=length((uv-vec2(0.5,0.45))/0.7071);
  float ab=dB<0.46?0.0:(dB<0.78?0.20*(dB-0.46)/0.32:0.20+0.42*clamp((dB-0.78)/0.22,0.0,1.0));
  over(c,a,vec3(0.0,0.008,0.03),ab*uBase);
  over(c,a,mix(vec3(0.31,0.47,1.0),vec3(0.55,0.24,1.0),1.0-uv.y),0.16*uSlow);
  { float s=dS<0.38?0.0:(dS<0.78?0.14*(dS-0.38)/0.40:0.14+0.16*clamp((dS-0.78)/0.22,0.0,1.0));
    float so=dS<0.30?0.20:(0.20+0.15*clamp((dS-0.30)/0.70,0.0,1.0));
    vec3 oc=mix(vec3(1.0,0.78,0.24),vec3(1.0,0.55,0.16),clamp((dS-0.3)/0.7,0.0,1.0));
    over(c,a,mix(vec3(0.227,0.914,1.0),oc,uSolar),mix(s,so,uSolar)*uSpeed); }
  over(c,a,vec3(1.0,0.157,0.157),0.32*smoothstep(0.42,1.0,dS)*uLow*(0.75+0.25*sin(uTime*6.0)));
  over(c,a,vec3(1.0,0.08,0.08),0.42*smoothstep(0.45,1.0,dS)*uDamage);
  { float dh=clamp(length((uv-vec2(0.5,0.4))/0.7071),0.0,1.0); over(c,a,uHitCol,0.75*dh*uHit); }
  vec3 add=vec3(0.0);
  add+=mix(vec3(0.706,0.424,1.0),vec3(0.227,0.914,1.0),1.0-uv.y)*mix(0.14,0.10,1.0-uv.y)*uAnom;
  { float dl=length((uv-vec2(0.5,0.7))/0.7071); vec3 lc=mix(vec3(1.0,0.81,0.30),vec3(1.0,0.29,0.85),smoothstep(0.0,0.5,dl));
    float la=mix(0.20,0.12,smoothstep(0.0,0.5,dl))*(1.0-smoothstep(0.5,0.85,dl)); add+=lc*la*uLeg; }
  { float t=dC; vec3 bc=mix(vec3(0.6,0.23,1.0),vec3(0.35,0.08,0.63),clamp(t/0.6,0.0,1.0)); float ba=mix(0.08,0.38,clamp(t/0.6,0.0,1.0)); add+=bc*ba*uBH; }
  { vec3 gc=mix(vec3(1.0,0.59,0.24),vec3(0.78,0.31,0.08),smoothstep(0.0,0.62,dS)); float ga=mix(0.06,0.32,smoothstep(0.0,0.62,dS)); add+=gc*ga*uGrav; }
  add+=vec3(0.227,0.914,1.0)*(smoothstep(0.58,0.86,dC)*0.28+smoothstep(0.86,1.0,dC)*0.27)*uShield;
  if(uBoost>0.001){   /* subtle tunnel glow + faint rays (the blur does the heavy lifting now) */
   vec2 q=(uv-vec2(0.5,0.48))/0.7071; float d=length(q); float ang=atan(q.y,q.x);
   float mask=smoothstep(0.11,0.74,d);
   float glow=smoothstep(0.17,1.0,d)*0.20+0.04*smoothstep(0.17,0.35,d);
   float ph=fract((ang+uTime*0.05)/(2.0*PI)*72.0); float ray=smoothstep(0.0,0.04,ph)*(1.0-smoothstep(0.04,0.10,ph));
   float pulse=0.55+0.45*sin(d*18.0-uTime*14.0);
   add+=vec3(0.15,0.75,1.0)*glow*uBoost + vec3(0.6,0.92,1.0)*ray*mask*(0.30+0.35*pulse)*uBoost*0.22; }
  { float df=length((uv-vec2(0.5,0.48))/0.7071); add+=mix(vec3(0.94,1.0,1.0),vec3(0.24,0.82,1.0),smoothstep(0.0,0.32,df))*uFlash*(1.0-smoothstep(0.0,0.72,df))*0.7; }
  gl_FragColor=vec4(clamp(base*(1.0-a)+c+add,0.0,1.0),1.0);
 }