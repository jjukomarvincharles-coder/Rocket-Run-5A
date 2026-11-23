/* ========== CAMERA MODES ========== */
const CameraMode={ current:0 };
function setCameraMode(m){
 CameraMode.current=m; SAVE.cameraMode=m; persist();
 Game.cameraMode=m;
 document.querySelectorAll('.cam-opt').forEach((el2,i)=>el2.classList.toggle('active',i===m));
 document.getElementById('cockpitFrame').classList.toggle('on',m===1);
 if(rocket){
  rocket.group.visible=(m===0);
 }
 Sound.setCameraMode(m); Sound.cameraSwitch();
}
function cycleCamera(){ setCameraMode((CameraMode.current+1)%3); }

