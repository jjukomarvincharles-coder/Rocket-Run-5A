const {chromium}=require('/opt/npm-tools/node_modules/playwright'); const fs=require('fs');
const file=process.argv[2]; const stub=fs.readFileSync('/home/claude/harness/three_stub.mjs','utf8');
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[800,360],[667,375],[568,320],[915,412]]){
 const p=await b.newPage({viewport:{width:w,height:h}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/*',r=>{const u=r.request().url();
  if(u.includes('three.module.js')) return r.fulfill({contentType:'application/javascript',body:stub});
  if(u.includes('EffectComposer.js')) return r.fulfill({contentType:'application/javascript',body:'export class EffectComposer{constructor(r){this.passes=[];this.renderTarget1={samples:0,dispose(){}};this.renderTarget2={samples:0,dispose(){}};this.readBuffer={texture:{}};} addPass(p){this.passes.push(p);} render(){} setSize(){} dispose(){}}'});
  if(u.includes('RenderPass.js')) return r.fulfill({contentType:'application/javascript',body:'export class RenderPass{constructor(s,c){this.scene=s;this.camera=c;}}'});
  if(u.includes('UnrealBloomPass.js')) return r.fulfill({contentType:'application/javascript',body:'export class UnrealBloomPass{constructor(v,s,r,t){this.strength=s;} setSize(){}}'});
  if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) return r.continue(); return r.abort();});
 await p.goto('file://'+file); await p.waitForTimeout(800);
 await (await p.$('text=LAUNCH')).click(); await p.waitForTimeout(400);
 const m0=await p.evaluate(()=>{const e=[...document.querySelectorAll('#overlay .btn')].find(x=>x.textContent.trim()==='LAUNCH');const r=e.getBoundingClientRect();return {bottom:Math.round(r.bottom),vh:innerHeight};});
 await (await p.$('#overlay >> text=/^LAUNCH$/')).click(); await p.waitForTimeout(1500);
 const st1=await p.evaluate(()=>document.getElementById('hud').classList.contains('hidden'));
 await p.keyboard.press('Escape'); await p.waitForTimeout(500);               // Esc during play -> pause
 const paused=await p.evaluate(()=>({ov:!document.getElementById('overlay').classList.contains('hidden'),t:(document.querySelector('#overlay .section-title')||{}).textContent}));
 const m=await p.evaluate(()=>{const ov=document.getElementById('overlay');return {scroll:ov.scrollHeight,client:ov.clientHeight,btn:[...ov.querySelectorAll('.btn')].map(e=>Math.round(e.getBoundingClientRect().bottom)).slice(-1)[0]};});
 if(w===800||w===568) await p.screenshot({path:`/home/claude/harness/pause_${w}.png`});
 await p.keyboard.press('Escape'); await p.waitForTimeout(500);               // Esc again -> resume
 const resumed=await p.evaluate(()=>document.getElementById('overlay').classList.contains('hidden'));
 console.log(`${w}x${h}  launch-btn-bottom ${m0.bottom}/${m0.vh}  hudShown:${!st1}  pause:${JSON.stringify(paused)}  pauseFits:${m.scroll<=m.client+2}(${m.scroll}/${m.client})  resumeOnBack:${resumed}  errors:${errs.length?errs[0]:'none'}`);
 await p.close();}
await b.close();})();
