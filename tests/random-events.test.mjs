import test from 'node:test';
import assert from 'node:assert/strict';
import {COUNTRIES,EVENTS} from '../dist/data.js';
import {createGame,chooseEvent,endTurn,availableEvents,validateSave} from '../dist/engine.js';
import {RANDOM_EVENTS,advanceRandom} from '../dist/random-events.js';
function fixture(id,roll=.2){const s=createGame(1001);s.randomEvents.pending=[{id,turn:1,deadline:3,roll,cause:''}];s.randomEvents.seen=[id];return s;}
test('局势抽取有种子差异，重复阅读和存档恢复不重抽结果',()=>{
 const ids=new Set();for(let seed=1;seed<30;seed++)ids.add(createGame(seed*37849).randomEvents.pending[0].id);assert.ok(ids.size>=5);
 const s=fixture('RND-06'),before=JSON.stringify(s);for(let i=0;i<10;i++)availableEvents(s);assert.equal(JSON.stringify(s),before);
 const restored=validateSave(JSON.parse(before));assert.deepEqual(restored.randomEvents,s.randomEvents);
 assert.equal(chooseEvent(s,'RND-06','r06-continue').message,chooseEvent(restored,'RND-06','r06-continue').message);
});
test('同一随机决策真实产生两个分支，成本与影响均计入反馈',()=>{
 const good=chooseEvent(fixture('RND-06',.1),'RND-06','r06-continue');
 const bad=chooseEvent(fixture('RND-06',.9),'RND-06','r06-continue');
 assert.equal(good.state.budget,34);assert.equal(bad.state.issues.energy,1);assert.equal(bad.state.countries.YAO.trust,40);
 assert.match(good.changes,/预算 \+4/);assert.match(bad.changes,/世界危机 \+4/);
 assert.equal(good.state.ap,2);assert.equal(good.state.randomEvents.pending.length,0);
 assert.throws(()=>chooseEvent(good.state,'RND-06','r06-continue'),/不可处理/);
});
test('选择第三座河港安排后，下一回合收到有来源的后续来函',()=>{
 let s=chooseEvent(fixture('RND-01'),'RND-01','r01-pay').state;
 assert.equal(s.budget,26);assert.equal(s.randomEvents.queued[0].id,'FUP-01');
 assert.ok(!availableEvents(s).some(e=>e.id==='FUP-01'));
 s=endTurn(s).state;assert.ok(availableEvents(s).some(e=>e.id==='FUP-01'));
 assert.equal(s.randomEvents.pending.find(p=>p.id==='FUP-01').cause,'港口的最后一班工人');
 s=chooseEvent(s,'FUP-01','f01-audit').state;assert.equal(s.credibility,65);
 validateSave(s);assert.ok(!availableEvents(s).some(e=>e.id==='FUP-01'));
});
test('不确定分支能够触发证词事件，主线责任事实不会被改写',()=>{
 const r=chooseEvent(fixture('RND-03',.9),'RND-03','r03-local');
 assert.equal(r.state.randomEvents.queued[0].id,'FUP-03');assert.equal(r.state.truth.attack,null);assert.equal(r.state.flags.attackEvidence,false);
});
test('暂缓只隐藏本回合，不消耗行动力；期限到达仅扣一次信任',()=>{
 let s=fixture('RND-01');const t=s.countries.CHENG.trust;
 s=chooseEvent(s,'RND-01','wait').state;assert.equal(s.ap,3);assert.ok(!availableEvents(s).some(e=>e.id==='RND-01'));
 s=endTurn(s).state;assert.ok(availableEvents(s).some(e=>e.id==='RND-01'));
 s=endTurn(s).state;assert.equal(s.turn,3);assert.ok(availableEvents(s).some(e=>e.id==='RND-01'));
 s=endTurn(s).state;assert.equal(s.turn,4);assert.equal(s.countries.CHENG.trust,t-2);assert.ok(!availableEvents(s).some(e=>e.id==='RND-01'));
 assert.equal(s.lastReport.entries.filter(e=>e.title==='来函逾期 · 港口的最后一班工人').length,1);
 s=endTurn(s).state;assert.equal(s.countries.CHENG.trust,t-2);
});
test('队列满时保留后续来函，空出位置后优先投递',()=>{
 const s=fixture('RND-01');s.randomEvents.pending.push({id:'RND-02',turn:1,deadline:3,roll:.1,cause:''});s.randomEvents.seen.push('RND-02');s.randomEvents.queued=[{id:'FUP-03',due:2,cause:'午夜电台的传闻'}];
 advanceRandom(s,2,()=>{});assert.equal(s.randomEvents.queued.length,1);assert.equal(s.randomEvents.pending.length,2);
 s.randomEvents.pending.shift();advanceRandom(s,3,()=>{});assert.equal(s.randomEvents.queued.length,0);assert.ok(s.randomEvents.pending.some(p=>p.id==='FUP-03'));
});
test('旧存档补齐随机队列但保留原有资源、主线随机状态与进度',()=>{
 const s=createGame(913);delete s.randomEvents;s.flags.evidence=true;s.ap=1;
 const restored=validateSave(JSON.parse(JSON.stringify(s)));
 assert.equal(restored.ap,1);assert.equal(restored.rng,s.rng);assert.equal(restored.flags.evidence,true);assert.equal(restored.budget,30);
 assert.equal(restored.randomEvents.pending.length,0);assert.deepEqual(endTurn(restored).state,endTurn(restored).state);
});
test('拒绝损坏的随机值、重复来函和已处理但仍待办的事件',()=>{
 for(const edit of [s=>s.randomEvents.pending[0].roll=2,s=>s.randomEvents.pending.push({...s.randomEvents.pending[0]}),s=>s.resolved.push('RND-01'),s=>s.randomEvents.queued.push({id:'RND-01',due:2,cause:''})]){const s=fixture('RND-01');edit(s);assert.throws(()=>validateSave(s),/随机来函/);}
});
test('胜利结算不再投递新来函，历史上限后仍能准确展示当回合变化',()=>{
 let s=fixture('RND-01');for(const k in s.issues)s.issues[k]=0;s.flags.durable=true;const r=endTurn(s).state;assert.equal(r.status,'won');assert.deepEqual(r.randomEvents,s.randomEvents);
 s=fixture('RND-01');s.history=Array.from({length:160},()=>({turn:1,title:'既有记录',text:'保持记录',tone:'info'}));s.turn=3;
 const next=endTurn(s).state;assert.ok(next.lastReport.entries.some(h=>h.title.includes('来函逾期')));assert.ok(next.lastReport.entries.every(h=>h.title!=='既有记录'));
});
test('每一个随机选项均可结算且支持存档；七位发言人都有回应',()=>{
 for(const e of RANDOM_EVENTS){assert.ok(COUNTRIES.some(c=>c.id===e.speaker));assert.equal(e.options.length,4);for(const o of e.options){for(const roll of [.1,.9]){const s=fixture(e.id,roll);const r=chooseEvent(s,e.id,o.id);assert.ok(r.response?.length>0,e.id+o.id);assert.equal(r.state.ap,3-o.ap);validateSave(r.state);}}}
 assert.equal(EVENTS.filter(e=>e.random).length,12);
});
