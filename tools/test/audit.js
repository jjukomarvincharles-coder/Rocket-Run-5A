const {chromium}=require('/opt/npm-tools/node_modules/playwright'); const fs=require('fs');
const file=process.argv[2]; const stub=fs.readFileSync('/home/claude/harness/three_stub.mjs','utf8');
const sizes=[[800,360],[740,340],[667,375],[568,320],[915,412],[1280,720],[390,700]];
const shots=process.argv[3]==='shots';
(async()=>{const b=await chromium.launch();
for(const [w,h] of sizes){
 const p=await b.newPage({viewport:{width:w,height:h}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/*',r=>{const u=r.request().url();
  if(u.includes('three.module.js')) return r.fulfill({contentType:'application/javascript',body:stub});
  if(u.includes('EffectComposer.js')) return r.fulfill({contentType:'application/javascript',body:'export class EffectComposer{constructor(r){this.passes=[];this.renderTarget1={samples:0,dispose(){}};this.renderTarget2={samples:0,dispose(){}};this.readBuffer={texture:{}};} addPass(p){this.passes.push(p);} render(){} setSize(){} dispose(){}}'});
  if(u.includes('RenderPass.js')) return r.fulfill({contentType:'application/javascript',body:'export class RenderPass{constructor(s,c){this.scene=s;this.camera=c;}}'});
  if(u.includes('UnrealBloomPass.js')) return r.fulfill({contentType:'application/javascript',body:'export class UnrealBloomPass{constructor(v,s,r,t){this.strength=s;} setSize(){}}'});
  if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) return r.continue(); return r.abort();});
 await p.goto('file://'+file); await p.waitForTimeout(900);
 const names=await p.evaluate(()=>[...document.querySelectorAll('#overlay .btn')].map(e=>e.textContent.trim()).filter(t=>t&&t.length<30));
 const measure=()=>p.evaluate(()=>{const ov=document.getElementById('overlay'),sc=ov.querySelector('.screen'),vw=innerWidth,vh=innerHeight;const r=sc?sc.getBoundingClientRect():null;const cl=[];
  for(const e of ov.querySelectorAll('.btn,.card,.stat-box,.title,.section-title')){const q=e.getBoundingClientRect();if(q.width&&(q.left<-1||q.right>vw+1))cl.push((e.textContent||'').trim().slice(0,10));}
  return {scrollH:ov.scrollHeight,clientH:ov.clientHeight,top:r?Math.round(r.top):null,sw:document.documentElement.scrollWidth,vw,needsScroll:ov.scrollHeight>ov.clientHeight+2,clippedX:cl.slice(0,3)};});
 const rows=[]; const tested=['LAUNCH','GAME MODES','GARAGE','UPGRADES','MISSIONS','GALAXY DATABASE','STORY LOGS','HALL OF FAME','PILOT PROFILE','LEADERBOARD','SETTINGS'];
 for(const n of names){ if(!tested.some(t=>n.toUpperCase().includes(t.split(' ')[0]))&&n!=='SETTINGS') continue;
  const h2=await p.$(`#overlay >> text="${n}"`); if(!h2) continue; await h2.click(); await p.waitForTimeout(450);
  const m=await measure(); rows.push(n.slice(0,16).padEnd(16)+(m.needsScroll?` scroll ${m.scrollH}/${m.clientH}`:' fits       ')+(m.top<0?' TOP-CLIPPED':'')+(m.sw>m.vw+1?' H-OVERFLOW':'')+(m.clippedX.length?' X-clip:'+m.clippedX.join('|'):''));
  if(shots&&w===800) await p.screenshot({path:`/home/claude/harness/scr_${n.replace(/\W+/g,'_')}.png`});
  await p.keyboard.press('Escape'); await p.waitForTimeout(350);
  const back=await p.evaluate(()=>({btns:[...document.querySelectorAll('#overlay .btn')].map(e=>e.textContent.trim()).slice(0,3)})); if(!back.btns.includes('LAUNCH')) rows.push('   !! Esc did not return to menu: '+back.btns.join(','));
 }
 await p.keyboard.press('Escape'); await p.waitForTimeout(300);
 const dlg=await p.evaluate(()=>document.getElementById('exitDlg')?.classList.contains('on'));
 console.log(`\n== ${w}x${h}  exit-dialog-on-menu-back: ${dlg}  errors: ${errs.length?errs[0]:'none'}`); rows.forEach(r=>console.log(r));
 await p.close();}
await b.close();})();
