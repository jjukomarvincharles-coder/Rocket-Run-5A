/* ========== FINAL PASS: tone-mapping + hyperdrive motion blur + screen effects (all on the GPU) ==========
   The 3D scene is rendered into an offscreen buffer; this ONE shader pass then (1) radial-motion-blurs the background toward the
   screen edges during boost like Asphalt/Need-for-Speed (the ship stays sharp), (2) tone-maps + sRGB-encodes the image, and
   (3) adds vignette / damage / tint / shield / tunnel effects. These used to be ~12 full-screen DOM layers.
   The old DOM elements stay in the page but hidden; game code keeps writing their opacity and this pass reads it. */
const ScreenFX=(()=>{
 const E={}; for(const k of ['hitFlash','slowTint','speedLines','lowFuelVig','anomalyTint','legendaryTint','damageVig','bhTint','gravTint','shieldEdge']) E[k]=document.getElementById(k);
 const hudEl=document.getElementById('hud');
 const FRAG=`precision highp float; varying vec2 vUv;
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
 }`;
 const mat=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,
  uniforms:{tScene:{value:null},uFocus:{value:new THREE.Vector2(0.5,0.4)},uAspect:{value:2},uFocusOn:{value:0},uExposure:{value:1.18},
   uTime:{value:0},uBase:{value:0},uHit:{value:0},uDamage:{value:0},uLow:{value:0},uSlow:{value:0},uSpeed:{value:0},uSolar:{value:0},uBoost:{value:0},uFlash:{value:0},uShield:{value:0},uBH:{value:0},uGrav:{value:0},uAnom:{value:0},uLeg:{value:0},uHitCol:{value:new THREE.Vector3(1,0.24,0.24)}},
  vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',fragmentShader:FRAG});
 const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat); quad.frustumCulled=false;
 const sc=new THREE.Scene(); sc.add(quad); const cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const U=mat.uniforms;
 const MAP={uHit:['hitFlash',22,5],uSlow:['slowTint',14,3.5],uSpeed:['speedLines',12,4],uLow:['lowFuelVig',10,3.5],uAnom:['anomalyTint',8,2.2],uLeg:['legendaryTint',8,2],uDamage:['damageVig',12,3],uBH:['bhTint',14,5],uGrav:['gravTint',14,5],uShield:['shieldEdge',14,5]};
 let boost=0,flash=0,t=0,lastHit='',lastSpd='',rt=null,rtN=-1; const sz=new THREE.Vector2(), pv=new THREE.Vector3();
 const opac=e=>{ const v=e&&e.style.opacity; return v?(parseFloat(v)||0):0; };
 return {
  setBoost(a){ boost=a; }, pulse(){ flash=1; },
  update(dt){
   t+=dt;
   for(const k in MAP){ const m=MAP[k],tgt=opac(E[m[0]]),cur=U[k].value; U[k].value=cur+(tgt-cur)*(1-Math.exp(-(tgt>cur?m[1]:m[2])*dt)); }
   const hs=E.hitFlash?E.hitFlash.style.background:''; if(hs!==lastHit){ lastHit=hs; const m=/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(hs); if(m) U.uHitCol.value.set(m[1]/255,m[2]/255,m[3]/255); }
   const ss=E.speedLines?E.speedLines.style.background:''; if(ss!==lastSpd){ lastSpd=ss; U.uSolar.value=/255,\s*200,\s*60/.test(ss)?1:0; }
   U.uBoost.value+=(boost-U.uBoost.value)*(1-Math.exp(-(boost>U.uBoost.value?16:6)*dt));
   flash=Math.max(0,flash-dt*2.6); U.uFlash.value=flash; U.uTime.value=t;
   U.uBase.value=(hudEl&&!hudEl.classList.contains('hidden'))?1:0;
   U.uExposure.value=renderer.toneMappingExposure;
   renderer.getDrawingBufferSize(sz); U.uAspect.value=sz.x/Math.max(1,sz.y);
   if(typeof rocket!=='undefined'&&rocket&&CameraMode.current===0){ pv.copy(rocket.group.position).project(camera); U.uFocus.value.set(pv.x*0.5+0.5,pv.y*0.5+0.5); U.uFocusOn.value=pv.z<1?1:0; } else U.uFocusOn.value=0;
  },
  target(){
   renderer.getDrawingBufferSize(sz); const w=Math.max(2,sz.x|0),h=Math.max(2,sz.y|0),n=((typeof Perf!=='undefined'?Perf.msaaOn:true)?qualityProfile.msaa:0)|0;
   if(!rt){ const hf=renderer.extensions.has('EXT_color_buffer_float')||renderer.extensions.has('EXT_color_buffer_half_float');
    rt=new THREE.WebGLRenderTarget(w,h,{type:hf?THREE.HalfFloatType:THREE.UnsignedByteType,samples:n,depthBuffer:true,generateMipmaps:false}); rtN=n; }
   if(rt.width!==w||rt.height!==h) rt.setSize(w,h);
   if(rtN!==n){ rt.samples=n; rt.dispose(); rtN=n; }
   return rt; },
  render(src){ U.tScene.value=src; renderer.setRenderTarget(null); renderer.render(sc,cam); }
 };
})();
function renderFrame(){
 let src;
 if(composer&&Perf.bloomOn){ composer.renderToScreen=false; composer.render(); src=composer.readBuffer.texture; }
 else { const rt=ScreenFX.target(); renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene,camera); renderer.setRenderTarget(null); src=rt.texture; }
 ScreenFX.render(src);
}
