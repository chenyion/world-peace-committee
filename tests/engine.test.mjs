import test from 'node:test';
import assert from 'node:assert/strict';
import {COUNTRIES,EVENTS,PROPOSALS} from '../dist/data.js';
import {createGame,crisis,chooseEvent,endTurn,diplomacy,projectedVotes,vote,validateSave,availableEvents,optionReason} from '../dist/engine.js';
const choose=(s,e,o)=>chooseEvent(s,e,o).state;
const next=s=>endTurn(s).state;
test('七港、16 个主线模板与12 个随机模板、开局危机 46',()=>{
 assert.equal(COUNTRIES.length,7);assert.equal(EVENTS.filter(e=>!e.random).length,16);assert.equal(EVENTS.length,28);assert.equal(new Set(EVENTS.map(e=>e.id)).size,28);
 for(const e of EVENTS){assert.equal(e.options.length,4);for(const id of e.countries)assert.ok(COUNTRIES.some(c=>c.id===id));}
 assert.equal(crisis(createGame()),46);
});
test('行动不足不会改变原状态，也不能处理未发生的事件',()=>{
 const s=createGame();s.ap=0;const before=JSON.stringify(s);
 assert.throws(()=>chooseEvent(s,'MIR-01','investigate'),/行动力/);assert.equal(JSON.stringify(s),before);
 assert.throws(()=>chooseEvent(createGame(),'HUM-01','relief'),/不可处理/);
});
test('申请准入被拒绝不会凭空获得故障证据',()=>{
 let s=createGame();s.countries.HUI.trust=20;s=choose(s,'MIR-01','investigate');s=next(s);
 assert.equal(s.flags.evidence,false);assert.equal(s.projects.length,0);
});
test('调查与实际维修分开：公开真相不会自动恢复设施',()=>{
 let s=choose(createGame(),'MIR-01','investigate');s=next(s);s=choose(s,'MIR-03','publish');
 assert.equal(s.flags.evidence,true);assert.equal(s.flags.damFixed,false);assert.equal(s.issues.water,2);
});
test('第三座河港协商改变同一个错峰靠泊选项的结果',()=>{
 let raw=createGame();let rejected=chooseEvent(raw,'MIR-02','withdraw');assert.equal(rejected.state.issues.border,2);
 let s=createGame();s.turn=2;s.issues.trade=0;s=choose(s,'SEC-02','energyDeal');s=choose(s,'MIR-02','withdraw');
 assert.equal(s.issues.border,0);assert.equal(s.flags.energyDeal,true);
});
test('缺少粮食通道时不能承诺能源交换',()=>{
 const s=createGame();s.turn=2;assert.throws(()=>chooseEvent(s,'SEC-02','energyDeal'),/航运/);
});
test('完整工程联络路线能归零，并且只在结算判定胜利',()=>{
 let s=createGame(1001);
 s=choose(s,'MIR-01','investigate');s=choose(s,'TRA-01','corridor');s=choose(s,'MIR-02','observe');s=next(s);
 s=choose(s,'MIR-03','jointReport');s=choose(s,'MIR-04','repair');s=choose(s,'SEC-02','energyDeal');s=next(s);
 s=choose(s,'MIR-02','withdraw');s=diplomacy(s,'CHI','talk').state;s=next(s);
 assert.equal(s.flags.damFixed,true);assert.ok(s.issues.agreement>0);
 s=choose(s,'END-01','jointTreaty');s=next(s);assert.equal(s.status,'playing');s=next(s);
 assert.equal(crisis(s),0);assert.equal(s.status,'won');assert.equal(s.flags.managed,true);
 assert.throws(()=>endTurn(s),/结束/);
});
test('替代供水与限期托管路线需要真实交接才能胜利',()=>{
 let s=createGame(1002);
 s=choose(s,'MIR-01','investigate');s=choose(s,'TRA-01','corridor');s=choose(s,'MIR-02','observe');s=next(s);
 s=choose(s,'MIR-03','jointReport');s=choose(s,'MIR-04','alternative');s=diplomacy(s,'CHI','talk').state;s=next(s);
 s=choose(s,'MIR-02','withdraw');s=next(s);s=next(s);
 assert.equal(s.flags.alternative,true);assert.equal(s.flags.damFixed,false);
 s=choose(s,'END-01','trusteeship');s=next(s);s=next(s);
 assert.equal(s.flags.durable,true);assert.equal(s.status,'playing');assert.ok(s.issues.agreement>0);
 s=choose(s,'END-03','handover');s=next(s);assert.equal(s.status,'won');
});
test('临时运水结束后恢复未修复的短缺，不能免费刷永久复航',()=>{
 let s=createGame();s.issues.trade=0;s=choose(s,'MIR-01','waterAid');s=next(s);assert.equal(s.issues.water,1);
 s=next(s);s=next(s);assert.ok(s.issues.water>=2);assert.equal(s.status,'playing');
});
test('停航有预警，升级后允许复航与救援',()=>{
 let s=createGame();s=next(s);s=next(s);assert.ok(s.history.some(h=>h.title==='边境预警'));
 s=next(s);assert.equal(s.flags.incident,true);assert.equal(s.issues.border,3);
 s=choose(s,'SEC-04','hardline');assert.equal(s.flags.war,true);assert.ok(s.issues.human>0);
 assert.ok(availableEvents(s).some(e=>e.id==='END-02'));s=choose(s,'END-02','phasedPeace');s=next(s);s=next(s);
 assert.equal(s.issues.border,0);assert.equal(s.flags.war,false);assert.ok(s.issues.human>0);
});
test('同种子同决策序列保持事实与随机状态，可存档恢复',()=>{
 const run=seed=>{let s=createGame(seed);s=next(s);s=next(s);s=next(s);return s;};
 const a=run(12345),b=run(12345);assert.deepEqual(a,b);
 const restored=validateSave(JSON.parse(JSON.stringify(a)));assert.equal(restored.truth.attack,a.truth.attack);assert.equal(restored.rng,a.rng);
 const one=next(a),two=next(restored);assert.deepEqual(one,two);
 const outcomes=new Set(Array.from({length:30},(_,i)=>run(i*548731+13).truth.attack));assert.ok(outcomes.size>=2);
});
test('普通议案四票、重大议案五票，弃权不降低门槛',()=>{
 for(const proposal of ['observers','sanctions']){
  let s=createGame();for(const c of COUNTRIES)s.countries[c.id].trust=0;
  for(const c of COUNTRIES.slice(0,4))s.countries[c.id].trust=100;
  const predicted=projectedVotes(s,proposal,true),count=predicted.filter(v=>v.vote==='yes').length;
  assert.equal(count,4);const result=vote(s,proposal,true);
  assert.equal(result.passed,proposal==='observers');assert.equal(result.votes.length,7);
 }
});
test('未通过议案不扣执行预算，每回合只可表决一次',()=>{
 let s=createGame();for(const c of COUNTRIES)s.countries[c.id].trust=0;
 const r=vote(s,'sanctions');assert.equal(r.passed,false);assert.equal(r.state.budget,s.budget);assert.equal(r.state.ap,2);
 assert.throws(()=>vote(r.state,'aidFund'),/一次/);
});
test('授权通过但缺少准入时不排班，执行预算退回',()=>{
 let s=createGame();for(const c of COUNTRIES)s.countries[c.id].trust=90;s.countries.CHI.trust=20;
 const r=vote(s,'observers');assert.equal(r.passed,true);assert.equal(r.state.flags.observers,false);assert.equal(r.state.budget,30);
});
test('维修因停工暂停且不会重复收费，恢复后继续原项目',()=>{
 let s=createGame();s.flags.evidence=true;s=choose(s,'MIR-04','repair');s.issues.energy=1;const b=s.budget;
 s=next(s);assert.equal(s.projects.find(p=>p.type==='repair').remaining,2);assert.equal(s.budget,b+6);
 s.issues.energy=0;s=next(s);s=next(s);assert.equal(s.flags.damFixed,true);
});
test('承诺到期违约只结算一次，按期完成则增加信誉',()=>{
 let s=createGame();s.flags.evidence=true;s=choose(s,'MIR-03','repairPromise');
 s=next(s);s=next(s);s=next(s);s=next(s);assert.equal(s.promises[0].broken,true);const c=s.credibility;s=next(s);assert.equal(s.credibility,c);
});
test('最后回合先判胜利，值班期上限与低信誉败局生效',()=>{
 let s=createGame();s.turn=24;for(const k in s.issues)s.issues[k]=0;s.flags.durable=true;assert.equal(next(s).status,'won');
 s=createGame();s.turn=24;assert.equal(next(s).status,'lost');
 s=createGame();s.credibility=10;s=next(s);s=next(s);assert.equal(s.status,'playing');s=next(s);assert.equal(s.status,'lost');
});
test('拒绝损坏、越界或未知类型的存档',()=>{
 assert.throws(()=>validateSave({version:1}));
 let s=createGame();s.ap=200;assert.throws(()=>validateSave(s),/行动力/);
 s=createGame();s.projects=[{type:'eval',name:'x',remaining:1,maintenance:0}];assert.throws(()=>validateSave(s),/项目/);
 s=createGame();s.countries.CHI.trust=-1;assert.throws(()=>validateSave(s),/信任/);
});
test('反复等候也不会产生负数或无法解释的凭空胜利',()=>{
 let s=createGame(20);for(let t=0;t<24&&s.status==='playing';t++){s=next(s);assert.ok(crisis(s)>=0&&crisis(s)<=100);assert.ok(s.budget>=0);}
 assert.equal(s.status,'lost');
});
test('临时供水尚在生效时不能叠加相同到期任务',()=>{
 let s=createGame();s=choose(s,'MIR-01','waterAid');s=next(s);s=next(s);s.issues.trade=0;
 assert.throws(()=>chooseEvent(s,'MIR-01','waterAid'),/生效/);
});
test('复航后通过长期安排归零，结局保留停航历史',()=>{
 let s=createGame();s.flags.war=false;s.flags.everWar=true;s.flags.durable=true;for(const k in s.issues)s.issues[k]=0;
 s=next(s);assert.equal(s.ending,'战后的和平');
});
test('临时配水与援助不能把未解决的设施风险伪装成归零胜利',()=>{
 let s=createGame();s.issues.trade=0;s.issues.border=0;s.issues.bloc=0;
 s=choose(s,'MIR-01','talkWater');s=next(s);s=next(s);s=choose(s,'MIR-01','waterAid');s=next(s);
 assert.equal(s.issues.water,0);assert.ok(s.issues.agreement>0);assert.equal(s.status,'playing');
});
test('80 个种子混合策略：合法选项不抛错，状态有界且存档可恢复',()=>{
 for(let seed=1;seed<=80;seed++){
  let s=createGame(seed*37849),r=seed;
  const rnd=()=>{r=(Math.imul(r,1664525)+1013904223)>>>0;return r/4294967296;};
  while(s.status==='playing'){
   for(let step=0;step<3&&s.ap>0;step++){
    const choices=availableEvents(s).flatMap(e=>e.options.filter(o=>!optionReason(s,o)).map(o=>[e.id,o.id]));
    if(choices.length&&rnd()<.7){const [e,o]=choices[Math.floor(rnd()*choices.length)];s=choose(s,e,o);}
    else {const c=COUNTRIES[Math.floor(rnd()*7)];if(!s.lobbied[c.id+'-talk']&&s.influence>=2)s=diplomacy(s,c.id).state;}
   }
   s=next(s);validateSave(JSON.parse(JSON.stringify(s)));
   assert.ok(s.budget>=0&&s.ap>=0);assert.ok(crisis(s)>=0&&crisis(s)<=100);
  }
 }
});
