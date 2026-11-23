const {chromium}=require('/opt/npm-tools/node_modules/playwright'); const fs=require('fs');
const frag=fs.readFileSync('/home/claude/harness/frag2.glsl','utf8');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:800,height:360}}); p.on('console',m=>console.log('page:',m.text()));
await p.setContent('<body style="margin:0;background:#000"><canvas id=c width=800 height=360></canvas></body>');
const res=await p.evaluate((frag)=>{
 const c=document.getElementById('c'); const gl=c.getContext('webgl2'); if(!gl) return {err:'no webgl2'};
 const mk=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);return [s,gl.getShaderInfoLog(s),gl.getShaderParameter(s,gl.COMPILE_STATUS)];};
 const [vs,vl,vok]=mk(gl.VERTEX_SHADER,'attribute vec3 position; attribute vec2 uv; varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }');
 const [fs,fl,fok]=mk(gl.FRAGMENT_SHADER,frag); if(!vok||!fok) return {err:'compile',vl,fl};
 const pr=gl.createProgram(); gl.attachShader(pr,vs); gl.attachShader(pr,fs); gl.bindAttribLocation(pr,0,'position'); gl.bindAttribLocation(pr,1,'uv'); gl.linkProgram(pr);
 if(!gl.getProgramParameter(pr,gl.LINK_STATUS)) return {err:'link',log:gl.getProgramInfoLog(pr)};
 // synthetic "scene": dark blue gradient, stars, a planet, and a bright ship at the focus point
 const t=document.createElement('canvas'); t.width=800; t.height=360; const g=t.getContext('2d');
 const gr=g.createLinearGradient(0,0,0,360); gr.addColorStop(0,'#05103a'); gr.addColorStop(1,'#1a0a40'); g.fillStyle=gr; g.fillRect(0,0,800,360);
 let seed=7; const R=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let i=0;i<420;i++){ g.fillStyle=`rgba(255,255,255,${0.4+R()*0.6})`; const r=R()<0.1?2.2:1.1; g.beginPath(); g.arc(R()*800,R()*360,r,0,6.3); g.fill(); }
 g.fillStyle='#b05a2a'; g.beginPath(); g.arc(610,110,46,0,6.3); g.fill(); g.fillStyle='#3a7bd5'; g.beginPath(); g.arc(150,250,36,0,6.3); g.fill();
 g.fillStyle='#ffd9a0'; g.fillRect(380,205,42,12); g.fillStyle='#fff'; g.fillRect(396,190,10,40);
 const tex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,t); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,0,0,0, 1,-1,0,1,0, -1,1,0,0,1, 1,1,0,1,1]),gl.STATIC_DRAW);
 gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,3,gl.FLOAT,false,20,0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1,2,gl.FLOAT,false,20,12);
 gl.useProgram(pr);
 window.__draw=(u)=>{ for(const k of ['uTime','uBase','uHit','uDamage','uLow','uSlow','uSpeed','uSolar','uBoost','uFlash','uShield','uBH','uGrav','uAnom','uLeg','uFocusOn']) gl.uniform1f(gl.getUniformLocation(pr,k),u[k]||0);
   gl.uniform1f(gl.getUniformLocation(pr,'uAspect'),800/360); gl.uniform1f(gl.getUniformLocation(pr,'uExposure'),1.18); gl.uniform2f(gl.getUniformLocation(pr,'uFocus'),0.5,0.5);
   gl.uniform3f(gl.getUniformLocation(pr,'uHitCol'),1,.24,.24); gl.uniform1i(gl.getUniformLocation(pr,'tScene'),0); gl.drawArrays(gl.TRIANGLE_STRIP,0,4); };
 return {ok:true};
},frag);
console.log('final-pass shader:',JSON.stringify(res));
if(res.ok){ const cases={calm:{uBase:1},boost:{uBase:1,uBoost:1,uTime:2,uSpeed:.6,uFocusOn:1}};
 for(const [n,u] of Object.entries(cases)){ await p.evaluate(u=>window.__draw(u),u); await p.screenshot({path:`/home/claude/harness/final_${n}.png`}); } }
await b.close();})();
