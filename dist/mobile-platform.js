// The Android bridge is available only in the app's bundled, offline page.
export function createPlatform(host=globalThis){
 const bridge=host.PeaceAndroid;
 const native=!!bridge&&typeof bridge.getItem==='function'&&typeof bridge.setItem==='function';
 const storage=native?{
  getItem(key){const result=JSON.parse(bridge.getItem(key));if(!result.ok)throw Error('无法读取本机存档。');return result.value;},
  setItem(key,value){if(!bridge.setItem(key,String(value)))throw Error('本机存档写入失败，请先导出进度。');}
 }:{getItem:key=>host.localStorage.getItem(key),setItem:(key,value)=>host.localStorage.setItem(key,value)};
 return {native,storage,
  canVibrate:()=>native?bridge.canVibrate():typeof host.navigator?.vibrate==='function',
  vibrate:()=>native?bridge.vibrate():host.navigator?.vibrate?.(12),
  exportFile:(name,text)=>bridge.exportSave(name,text),
  importFile:()=>bridge.importSave(),
  requestExit:()=>bridge.requestExit(),
  ready:()=>{if(native)bridge.ready();}
 };
}
export const platform=createPlatform();
