import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlatform} from '../dist/mobile-platform.js';
import {createGame} from '../dist/engine.js';
import {restoreSnapshot,writeSlot,readSlot,AUTOSAVE_KEY} from '../dist/preferences.js';

function nativeFixture(){
 const data=new Map(),calls=[];
 const bridge={getItem:key=>JSON.stringify({ok:true,value:data.get(key)??null}),setItem:(key,value)=>{data.set(key,value);return true;},canVibrate:()=>true,vibrate:()=>calls.push('vibrate'),exportSave:(...args)=>calls.push(['export',...args]),importSave:()=>calls.push('import'),requestExit:()=>calls.push('exit'),ready:()=>calls.push('ready')};
 return {data,calls,bridge,host:{PeaceAndroid:bridge,get localStorage(){throw Error('Android must not use browser storage');}}};
}
test('browser storage stays compatible without an Android bridge',()=>{
 const data=new Map();const p=createPlatform({localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
 assert.equal(p.native,false);p.storage.setItem('old-save','value');assert.equal(p.storage.getItem('old-save'),'value');assert.equal(p.canVibrate(),false);
});
test('native data persists across platform instances, including slots and pre-restore backup',()=>{
 const f=nativeFixture(),p=createPlatform(f.host),old=createGame(1001),next=createGame(1002);
 restoreSnapshot(p.storage,old,null);writeSlot(p.storage,'1',old);restoreSnapshot(p.storage,next,old);
 const reopened=createPlatform(f.host);
 assert.equal(JSON.parse(reopened.storage.getItem(AUTOSAVE_KEY)).seed,1002);
 assert.equal(readSlot(reopened.storage,'1').state.seed,1001);assert.equal(readSlot(reopened.storage,'backup').state.seed,1001);
});
test('native write failure is propagated and original automatic save survives',()=>{
 const f=nativeFixture(),p=createPlatform(f.host),old=createGame(1001);restoreSnapshot(p.storage,old,null);
 f.bridge.setItem=()=>false;
 assert.throws(()=>restoreSnapshot(p.storage,createGame(1002),old));
 assert.equal(JSON.parse(f.data.get(AUTOSAVE_KEY)).seed,1001);
});
test('native read errors are not silently treated as empty saves',()=>{
 const f=nativeFixture();f.bridge.getItem=()=>'{"ok":false}';assert.throws(()=>createPlatform(f.host).storage.getItem(AUTOSAVE_KEY));
});
test('native feedback and file actions dispatch through the bridge',()=>{
 const f=nativeFixture(),p=createPlatform(f.host);assert.equal(p.canVibrate(),true);p.vibrate();p.exportFile('save.json','{}');p.importFile();p.requestExit();p.ready();
 assert.deepEqual(f.calls,['vibrate',['export','save.json','{}'],'import','exit','ready']);
});
