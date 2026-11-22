import {validateSave} from './engine.js';

export const PREFERENCES_KEY='peace-committee-preferences-v1';
export const AUTOSAVE_KEY='peace-committee-save-v1';
export const PAUSED_KEY='peace-committee-paused-v1';
export const DEFAULT_PREFERENCES=Object.freeze({font:'normal',volume:35,muted:false,press:true,vibration:false});
export function normalizePreferences(value){
 const p=value&&typeof value==='object'?value:{};
 return {font:['normal','large','extra'].includes(p.font)?p.font:'normal',volume:Number.isFinite(p.volume)?Math.max(0,Math.min(100,Math.round(p.volume))):35,muted:typeof p.muted==='boolean'?p.muted:false,press:typeof p.press==='boolean'?p.press:true,vibration:typeof p.vibration==='boolean'?p.vibration:false};
}
export function readPreferences(storage){
 try{return normalizePreferences(JSON.parse(storage.getItem(PREFERENCES_KEY)));}catch{return {...DEFAULT_PREFERENCES};}
}
export function writePreferences(storage,prefs){
 const clean=normalizePreferences(prefs);storage.setItem(PREFERENCES_KEY,JSON.stringify(clean));return clean;
}
function slotKey(id){
 if(!['1','2','3','backup'].includes(String(id)))throw Error('未知存档位。');
 return 'peace-committee-slot-'+id+'-v1';
}
export function readSlot(storage,id){
 try{
  const raw=storage.getItem(slotKey(id));if(raw===null)return {kind:'empty'};
  const entry=JSON.parse(raw);
  if(entry.version!==1||typeof entry.savedAt!=='string'||!Number.isFinite(Date.parse(entry.savedAt)))throw Error('存档格式不正确');
  return {kind:'valid',savedAt:entry.savedAt,state:validateSave(entry.state)};
 }catch{return {kind:'invalid'};}
}
export function writeSlot(storage,id,state){
 const entry={version:1,savedAt:new Date().toISOString(),state:validateSave(JSON.parse(JSON.stringify(state)))};
 storage.setItem(slotKey(id),JSON.stringify(entry));return entry;
}
// Do not change the live world until the restore and its safety copy are durable.
export function restoreSnapshot(storage,next,current){
 const clean=validateSave(JSON.parse(JSON.stringify(next)));
 if(current)writeSlot(storage,'backup',current);
 storage.setItem(AUTOSAVE_KEY,JSON.stringify(clean));return clean;
}
