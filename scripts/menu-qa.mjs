import {createGame} from '../dist/engine.js';

export async function menuChecks(api){
 const {send,evaluate,click,layout,close,screenshot,wait,assert,saved}=api;
 await close();
 await evaluate(`for(const key of Object.keys(localStorage))if(key.startsWith('peace-committee-'))localStorage.removeItem(key)`);
 for(const [width,height] of [[320,568],[360,640],[390,844],[430,932]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
  for(const font of ['normal','large','extra']){
   await evaluate(`localStorage.setItem('peace-committee-preferences-v1',JSON.stringify({font:${JSON.stringify(font)},volume:0,muted:true,press:true,vibration:false}));location.reload()`);await wait(350);
   assert(await evaluate(`!!document.querySelector('.title-screen')&&document.querySelector('[data-action="resume"]').disabled&&!document.querySelector('.world-map')`),'Fresh launch stays in menu');
   assert((await saved())===null,'Visiting menu does not create save');await layout('fresh menu '+font+' '+width);
   if(font==='normal')await screenshot('menu-fresh-'+width);
  }
 }
 await send('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:1,mobile:true});await wait(150);
 await click('[data-action="settings"][data-section="slots"]');await layout('menu empty slots');assert(await evaluate(`document.querySelector('[data-action="slot-save"]').disabled&&document.querySelector('[data-action="export"]').disabled`),'No placeholder game can be saved');await close();
 await click('[data-action="settings"]:not([data-section])');await layout('menu settings');await close();assert((await saved())===null,'Settings do not start game');
 await click('[data-action="new"]');await layout('first game setup');await close();assert((await saved())===null,'Cancel first start retains empty save');
 await click('[data-action="new"]');await evaluate(`document.querySelector('#seed-input').value='1001'`);await click('[data-action="confirm-new"]');assert(await evaluate(`document.querySelectorAll('.country-shape').length===7`),'Start enters playable world');assert((await saved()).seed===1001,'Start creates intended world');assert(await evaluate(`localStorage.getItem('peace-committee-slot-backup-v1')===null`),'No phantom backup');
 await click('[data-action="roster"]');await click('[data-action="country"][data-id="LAN"]');await click('[data-action="diplomacy"][data-mode="talk"]');await close();const before=await evaluate(`localStorage.getItem('peace-committee-save-v1')`);
 await send('Page.reload');await wait(400);assert(await evaluate(`!!document.querySelector('.title-screen')&&!document.querySelector('[data-action="resume"]').disabled`),'Reload existing game opens menu');assert(await evaluate(`localStorage.getItem('peace-committee-save-v1')`)===before,'Opening menu does not change progress');await layout('saved menu extra');await screenshot('menu-saved-320');
 await click('[data-action="resume"]');assert((await saved()).ap===2,'Continue preserves actions');assert(await evaluate(`!!document.querySelector('.world-map')`),'Continue enters world');
 const manual={version:1,savedAt:new Date().toISOString(),state:createGame(1002)};await evaluate(`localStorage.setItem('peace-committee-slot-1-v1',${JSON.stringify(JSON.stringify(manual))});location.reload()`);await wait(400);
 await click('[data-action="settings"][data-section="slots"]');await click('[data-action="slot-load"]');await layout('menu load confirmation');await close();assert(await evaluate(`!!document.querySelector('.title-screen')`),'Cancel load remains menu');assert((await saved()).seed===1001,'Cancel load preserves game');
 await click('[data-action="settings"][data-section="slots"]');await click('[data-action="slot-load"]');await click('[data-action="confirm-import"]');assert((await saved()).seed===1002,'Menu load enters selected archive');assert(await evaluate(`JSON.parse(localStorage.getItem('peace-committee-slot-backup-v1')).state.ap===2`),'Load retains previous progress backup');
 await send('Page.reload');await wait(400);await click('[data-action="new"]');await close();assert((await saved()).seed===1002,'Cancel new game protects archive');
 await click('[data-action="new"]');await evaluate(`document.querySelector('#seed-input').value='1003'`);await click('[data-action="confirm-new"]');assert((await saved()).seed===1003,'New game replaces active world');assert(await evaluate(`JSON.parse(localStorage.getItem('peace-committee-slot-backup-v1')).state.seed===1002&&JSON.parse(localStorage.getItem('peace-committee-slot-1-v1')).state.seed===1002`),'New game protects previous world and manual slot');
 await send('Page.reload');await wait(400);await click('[data-action="new"]');await evaluate(`window.__menuSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='peace-committee-save-v1')throw Error('Test quota exceeded');return window.__menuSet.call(this,k,v)};document.querySelector('#seed-input').value='1004'`);await click('[data-action="confirm-new"]');assert((await saved()).seed===1003,'Failed new game preserves current archive');assert(await evaluate(`!!document.querySelector('.title-screen')`),'Failed start stays in menu');await evaluate('Storage.prototype.setItem=window.__menuSet');await close();
 await evaluate(`localStorage.setItem('peace-committee-save-v1','{broken');location.reload()`);await wait(400);await close();await layout('damaged archive menu');assert(await evaluate(`document.querySelector('[data-action="resume"]').disabled&&localStorage.getItem('peace-committee-save-v1')==='{broken'`),'Damaged save is preserved and cannot continue');
 await evaluate(`localStorage.removeItem('peace-committee-save-v1');localStorage.removeItem('peace-committee-slot-backup-v1');location.reload()`);await wait(400);await click('[data-action="settings"][data-section="slots"]');await click('[data-action="slot-load"]');await click('[data-action="confirm-import"]');assert((await saved()).seed===1002,'Manual archive works without autosave');assert(await evaluate(`localStorage.getItem('peace-committee-slot-backup-v1')===null`),'Loading on fresh menu does not fabricate backup');
 await evaluate(`localStorage.removeItem('peace-committee-preferences-v1')`);
 return {freshLaunch:true,existingLaunch:true,startContinueLoad:true,cancelProtectsSave:true,newGameBackup:true,firstLoadNoBackup:true,quotaFailure:true,damagedArchive:true,viewports:4,fonts:3};
}
