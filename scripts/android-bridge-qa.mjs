import {createGame} from '../dist/engine.js';
// Browser-side contract tests, not a substitute for Android hardware tests.
export async function androidBridgeChecks({send,evaluate,click,close,layout,screenshot,wait,assert}){
 const prefix='qa-native:',key='peace-committee-save-v1';
 await close();
 const webSave=await evaluate(`localStorage.getItem('${key}')`);
 await evaluate(`Object.keys(localStorage).filter(k=>k.startsWith('${prefix}')).forEach(k=>localStorage.removeItem(k))`);
 const {identifier}=await send('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.nativeCalls=[];window.nativeFailWrites=false;
 window.PeaceAndroid={
  getItem:key=>JSON.stringify({ok:true,value:localStorage.getItem('${prefix}'+key)}),
  setItem:(key,value)=>{if(window.nativeFailWrites)return false;localStorage.setItem('${prefix}'+key,value);return true;},
  canVibrate:()=>true,vibrate:()=>nativeCalls.push('vibrate'),
  exportSave:(name,text)=>{window.nativeExport={name,text};nativeCalls.push('export');},
  importSave:()=>nativeCalls.push('import'),requestExit:()=>nativeCalls.push('exit'),ready:()=>nativeCalls.push('ready')
 };
 // Android vibration must work even when WebView does not expose navigator.vibrate.
 Object.defineProperty(navigator,'vibrate',{configurable:true,value:undefined});
 `});
 try {
  await send('Page.reload');await wait(650);
  assert(await evaluate(`nativeCalls.includes('ready')&&document.querySelector('[data-action="resume"]').disabled`),'Native boots without reading browser save');
  await click('[data-action="settings"]:last-child');await layout('native settings');
  assert(await evaluate(`!document.querySelector('#settings-vibration').disabled`),'Native vibration works without navigator.vibrate');
  await evaluate(`const checkbox=document.querySelector('#settings-vibration');checkbox.checked=true;checkbox.dispatchEvent(new Event('change',{bubbles:true}))`);
  await close();await click('[data-action="new"]');await click('[data-action="confirm-new"]');
  const initial=await evaluate(`localStorage.getItem('${prefix+key}')`);
  assert(initial&&await evaluate(`nativeCalls.includes('vibrate')`),'Native new game persisted and feedback bridged');
  await evaluate(`window.PeaceMobile.back()`);await layout('native exit prompt');
  assert(await evaluate(`document.querySelector('#dialog').dataset.type==='exit'&&!document.querySelector('#dialog').textContent.includes('当前为网页版')`),'Back offers native exit text');
  await evaluate(`window.PeaceMobile.back()`);assert(await evaluate(`!document.querySelector('#dialog').open`),'Back closes dialog first');
  await evaluate(`window.PeaceMobile.pause()`);assert(await evaluate(`localStorage.getItem('${prefix+key}')`)===initial,'Pause preserves world');
  await click('[data-action="settings"]');await click('[data-action="settings"][data-section="slots"]');await click('[data-action="slot-save"]');
  assert(await evaluate(`!!localStorage.getItem('${prefix}peace-committee-slot-1-v1')`),'Manual save uses app storage');
  await click('[data-action="export"]');assert(await evaluate(`nativeExport.text`)===JSON.stringify(JSON.parse(initial),null,2),'Native export contains current world');
  await click('[data-action="import"]');assert(await evaluate(`nativeCalls.includes('import')`),'Import invokes native picker');
  const incoming=JSON.stringify(createGame(7777));
  await evaluate(`window.PeaceMobile.receive('import',${JSON.stringify(incoming)})`);await layout('native import preview');await close();
  assert(await evaluate(`localStorage.getItem('${prefix+key}')`)===initial,'Cancelled native import leaves progress unchanged');
  await evaluate(`window.PeaceMobile.receive('import','{}')`);assert(await evaluate(`document.querySelector('#dialog').dataset.type==='message'`),'Invalid native file rejected');await close();
  await evaluate(`window.PeaceMobile.receive('import',${JSON.stringify(incoming)});window.nativeFailWrites=true`);await click('[data-action="confirm-import"]');
  assert(await evaluate(`localStorage.getItem('${prefix+key}')`)===initial,'Failed native restore leaves previous save');
  await evaluate(`window.nativeFailWrites=false;window.PeaceMobile.receive('import',${JSON.stringify(incoming)})`);await click('[data-action="confirm-import"]');
  assert(await evaluate(`JSON.parse(localStorage.getItem('${prefix+key}')).seed`)===7777,'Confirmed native file restored');
  assert(await evaluate(`JSON.parse(localStorage.getItem('${prefix}peace-committee-slot-backup-v1')).state.seed`)===JSON.parse(initial).seed,'Native restore keeps previous world backup');
  await send('Page.reload');await wait(650);assert(await evaluate(`!!document.querySelector('.title-screen')&&!document.querySelector('[data-action="resume"]').disabled`),'Native restart offers continue');
  await click('[data-action="resume"]');await evaluate(`window.PeaceMobile.back()`);await click('[data-action="confirm-exit"]');await layout('native menu');await screenshot('android-menu-contract-320');
  await evaluate(`window.PeaceMobile.back()`);assert(await evaluate(`nativeCalls.includes('exit')`),'Back on menu requests native confirmation');
  assert(await evaluate(`localStorage.getItem('${key}')`)===webSave,'Android flows do not alter browser save');
  return {passed:true,mode:'simulated native bridge in Chrome; no Android hardware',storage:true,back:true,lifecycle:true,importExport:true,failedWrite:true};
 } finally {await send('Page.removeScriptToEvaluateOnNewDocument',{identifier});}
}
