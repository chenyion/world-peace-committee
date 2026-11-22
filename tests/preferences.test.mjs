import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,chooseEvent,validateSave} from '../dist/engine.js';
import {normalizePreferences,readPreferences,writePreferences,readSlot,writeSlot,restoreSnapshot,PREFERENCES_KEY,AUTOSAVE_KEY} from '../dist/preferences.js';
const storage=()=>{const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
test('首次开始或读档不创建虚构的旧值班期备份',()=>{
 const db=storage(),next=createGame(42);const restored=restoreSnapshot(db,next,null);
 assert.equal(restored.seed,42);assert.equal(readSlot(db,'backup').kind,'empty');assert.equal(JSON.parse(db.getItem(AUTOSAVE_KEY)).seed,42);
});
test('设置修复未知字号、损坏数据和越界音量，静音保持独立',()=>{
 assert.deepEqual(normalizePreferences({font:'huge',volume:500,muted:true,press:'false',vibration:true}),{font:'normal',volume:100,muted:true,press:true,vibration:true});
 const db=storage();db.setItem(PREFERENCES_KEY,'broken');assert.equal(readPreferences(db).volume,35);
 writePreferences(db,{font:'extra',volume:0,muted:false,press:false,vibration:true});assert.deepEqual(readPreferences(db),{font:'extra',volume:0,muted:false,press:false,vibration:true});
});
test('三个手动存档相互独立，保存后不随当前河道变化',()=>{
 const db=storage(),s=createGame(1001);writeSlot(db,1,s);writeSlot(db,2,createGame(1002));writeSlot(db,3,createGame(1003));s.budget=0;
 assert.equal(readSlot(db,1).state.budget,createGame(1001).budget);assert.equal(readSlot(db,2).state.seed,1002);assert.equal(readSlot(db,3).state.seed,1003);assert.equal(readSlot(db,'backup').kind,'empty');
});
test('读档保留随机状态与决策结果，同时备份当前值班期',()=>{
 const db=storage(),previous=validateSave(createGame(1001)),current=chooseEvent(previous,'MIR-01','investigate').state;
 const restored=restoreSnapshot(db,previous,current);
 assert.deepEqual(restored,previous);assert.deepEqual(JSON.parse(db.getItem(AUTOSAVE_KEY)),previous);assert.deepEqual(readSlot(db,'backup').state,current);
});
test('恢复读档前备份不会先覆盖要读取的快照',()=>{
 const db=storage(),a=createGame(1001),b=createGame(1002);restoreSnapshot(db,a,b);
 const snapshot=readSlot(db,'backup').state;restoreSnapshot(db,snapshot,a);
 assert.equal(JSON.parse(db.getItem(AUTOSAVE_KEY)).seed,1002);assert.equal(readSlot(db,'backup').state.seed,1001);
});
test('非法导入不写入自动档或备份，损坏槽位仍可显式覆盖',()=>{
 const db=storage(),current=createGame(1001);db.setItem(AUTOSAVE_KEY,JSON.stringify(current));
 assert.throws(()=>restoreSnapshot(db,{seed:0},current));assert.equal(readSlot(db,'backup').kind,'empty');assert.deepEqual(JSON.parse(db.getItem(AUTOSAVE_KEY)),current);
 db.setItem('peace-committee-slot-1-v1','{bad');assert.equal(readSlot(db,1).kind,'invalid');writeSlot(db,1,current);assert.equal(readSlot(db,1).kind,'valid');
 assert.throws(()=>writeSlot(db,'unexpected',current));
});
test('存储空间不足时读档失败，原自动档与调用方状态不变',()=>{
 const db=storage(),current=createGame(1001),copy=JSON.stringify(current);db.setItem(AUTOSAVE_KEY,copy);
 const set=db.setItem;db.setItem=(key,value)=>{if(key===AUTOSAVE_KEY)throw Error('QuotaExceeded');set(key,value);};
 assert.throws(()=>restoreSnapshot(db,createGame(1002),current),/QuotaExceeded/);
 assert.equal(JSON.stringify(current),copy);assert.equal(db.getItem(AUTOSAVE_KEY),copy);assert.equal(readSlot(db,'backup').state.seed,1001);
});
