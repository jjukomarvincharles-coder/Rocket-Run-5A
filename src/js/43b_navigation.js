/* ========== BACK BUTTON / NAVIGATION ==========
   Android back button (Capacitor), browser back (history) and Esc all go through Nav.back():
   playing -> pause | paused -> resume | photo mode -> exit photo | menu screens -> their BACK button | main menu -> "exit?" popup,
   and pressing back again while that popup is open exits. */
const Nav=(()=>{
 let dlg=null, open=false, leaving=false;
 function build(){
  if(dlg) return dlg;
  dlg=document.createElement('div'); dlg.id='exitDlg';
  dlg.innerHTML='<div class="exit-card"><div class="exit-title">EXIT ROCKET RUN?</div><div class="exit-sub">Press back again to exit</div>'+
   '<div class="exit-row"><button id="exitStay">STAY</button><button id="exitGo">EXIT</button></div></div>';
  document.body.appendChild(dlg);
  dlg.querySelector('#exitStay').onclick=close; dlg.querySelector('#exitGo').onclick=exit;
  dlg.addEventListener('click',e=>{ if(e.target===dlg) close(); });
  return dlg;
 }
 function show(){ build().classList.add('on'); open=true; }
 function close(){ if(dlg) dlg.classList.remove('on'); open=false; }
 function exit(){
  close();
  try{ const A=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App; if(A&&A.exitApp){ A.exitApp(); return; } }catch(e){}
  leaving=true; try{ window.close(); }catch(e){}
  setTimeout(()=>{ try{ history.go(-2); }catch(e){} },80);
 }
 function back(){
  if(open){ exit(); return; }
  if(Game.photoMode){ togglePhotoMode(); return; }
  const st=Game.state;
  if(st==='PLAYING'){ pauseGame(); return; }
  if(st==='PAUSED'){ resumeGame(); return; }
  if(st==='ROUTE'||st==='DECISION'){ toast('CHOOSE AN OPTION'); return; }
  const ov=document.getElementById('overlay');
  if(ov&&!ov.classList.contains('hidden')){
   const btns=[...ov.querySelectorAll('[data-act="back"],#expBack,.btn,button')];
   let b=btns.find(e=>/^\s*(BACK|CLOSE|CANCEL|RETURN|DONE)\s*$/i.test(e.textContent||''));
   if(!b&&st==='GAMEOVER') b=btns.find(e=>/MAIN MENU/i.test(e.textContent||''));
   if(b){ b.click(); return; }
  }
  show();
 }
 /* Android (Capacitor): the plugin may register a moment after load, so retry briefly */
 let tries=0; (function hook(){
  try{ const A=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;
   if(A&&A.addListener){ A.addListener('backButton',()=>back()); return; } }catch(e){}
  if(++tries<20) setTimeout(hook,300);
 })();
 /* Browser / installed web app: keep one history entry in front so the back gesture is ours */
 try{
  history.replaceState({rr:0},''); history.pushState({rr:1},'');
  window.addEventListener('popstate',()=>{ if(leaving) return; history.pushState({rr:1},''); back(); });
 }catch(e){}
 window.addEventListener('keydown',e=>{ if(e.code==='Escape'&&Game.state!=='PLAYING'&&Game.state!=='PAUSED') back(); });
/* every screen change: scroll back to the top and show the on-screen BACK button when the screen has one */
 const nb=document.createElement('button'); nb.id='navBack'; nb.textContent='‹ BACK'; nb.onclick=()=>back(); document.body.appendChild(nb);
 const ovEl=document.getElementById('overlay');
 const BACKRE=/^\s*(BACK|CLOSE|CANCEL|RETURN|DONE)\s*$/i;
 function refresh(){ const visible=ovEl&&!ovEl.classList.contains('hidden');
  const has=visible&&[...ovEl.querySelectorAll('.btn,button')].some(e=>BACKRE.test(e.textContent||'')&&e.id!=='navBack');
  nb.classList.toggle('on',!!has); }
 if(ovEl){ new MutationObserver(()=>{ ovEl.scrollTop=0; refresh(); }).observe(ovEl,{childList:true,attributes:true,attributeFilter:['class']}); refresh(); }
 return {back,show,close,exit};
})();
