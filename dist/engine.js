import { COUNTRIES, EVENTS, ISSUES, PROPOSALS } from './data.js';
import {initRandom,spawnRandom,advanceRandom,resolveRandom,validateRandom} from './random-events.js';
export const VERSION = 1;
const clamp = (x,a=0,b=100) => Math.min(b,Math.max(a,x));
const copy = s => structuredClone(s);
const need = (condition,message) => { if (!condition) throw new Error(message); };
export function createGame(seed=271006) {
  const n = Number(seed) >>> 0 || 271006;
  const s={version:VERSION,seed:n,rng:n,turn:1,limit:24,ap:3,budget:30,influence:20,credibility:60,status:'playing',lowTrustTurns:0,
    issues:{border:2,water:2,bloc:2,trade:2,energy:0,credit:0,human:0,agreement:0},
    countries:Object.fromEntries(COUNTRIES.map(c=>[c.id,{trust:c.trust}])),
    flags:{access:false,evidence:false,report:false,damFixed:false,alternative:false,allocation:false,observers:false,hotline:false,energyTopic:false,energyDeal:false,civilEnergy:false,escrow:false,attackEvidence:false,incident:false,ultimatum:false,war:false,everWar:false,peace:false,durable:false,managed:false,sanctions:false,pauseUsed:false},
    truth:{attack:null},projects:[],promises:[],cooldowns:{},resolved:[],firstSeen:{},lobbied:{},passed:[],votesThisTurn:0,
    history:[{turn:1,title:'新的任期开始',text:'镜河水位下降，七国各持立场。先查明事实，或通过第三国创造谈判空间。',tone:'info'}],
    trajectory:[46],lastReport:null,actionCount:0,ending:null};
  initRandom(s);spawnRandom(s,1,true);return s;
}
export function crisis(s) { return clamp(Object.entries(ISSUES).reduce((sum,[key,value])=>sum+s.issues[key]*value.weight,0)); }
export function sources(s) { return Object.entries(ISSUES).filter(([k])=>s.issues[k]>0).map(([key,v])=>({key,...v,value:s.issues[key]*v.weight,level:s.issues[key]})); }
const trust = (s,id,n) => { s.countries[id].trust=clamp(s.countries[id].trust+n); };
const tr = (s,id) => s.countries[id].trust;
const issue = (s,key,n) => { s.issues[key]=clamp(s.issues[key]+n,0,key==='border'?4:3); };
function log(s,title,text,tone='info') { s.history.unshift({turn:s.turn,title,text,tone}); s.history=s.history.slice(0,160); }
function random(s) { let t=s.rng; t^=t<<13;t^=t>>>17;t^=t<<5;s.rng=t>>>0;return s.rng/4294967296; }
const activeProject = (s,type) => s.projects.some(p=>p.type===type);
function project(s,type,name,remaining,maintenance=0) {
  need(!activeProject(s,type),'这项工作已经在进行中。');
  s.projects.push({id:`${type}-${s.turn}-${s.actionCount}`,type,name,remaining,maintenance});
}
function spend(s,budget=0,influence=0,ap=1) {
  need(s.status==='playing','这届任期已经结束，请开始新的任期。');
  need(s.ap>=ap,'本回合行动力不足。请先推进回合。');
  need(s.budget>=budget,'预算不足，可以争取拨款或等待下一回合会费。');
  need(s.influence>=influence,'外交影响力不足，可通过会谈与履约恢复。');
  s.ap-=ap;s.budget-=budget;s.influence-=influence;s.actionCount++;
}
export function isEligible(s,id) {
  if(id.startsWith('RND-')||id.startsWith('FUP-'))return Boolean(s.randomEvents?.pending.some(p=>p.id===id&&p.turn<=s.turn&&p.deadline>=s.turn));
  const f=s.flags,i=s.issues;
  const complete=f.damFixed||f.alternative;
  const map={
    'MIR-01':i.water>0&&!f.evidence&&!activeProject(s,'investigate'),
    'MIR-02':i.border>0&&i.border<4&&!f.peace,
    'MIR-03':f.evidence&&!f.report,
    'MIR-04':f.evidence&&!complete&&!activeProject(s,'repair')&&!activeProject(s,'alternative'),
    'TRA-01':i.trade>0&&!activeProject(s,'insurance')&&!activeProject(s,'corridor')&&!activeProject(s,'landRoute'),
    'TRA-02':i.energy>0,
    'SEC-01':f.incident&&i.bloc>0,
    'SEC-02':!f.energyDeal&&!activeProject(s,'energyUpgrade')&&(s.turn>=2||f.energyTopic),
    'SEC-03':f.incident&&!s.resolved.includes('SEC-03')&&i.border>0,
    'SEC-04':i.border>=3&&!f.peace&&!s.resolved.includes('SEC-04'),
    'HUM-01':i.human>0&&!activeProject(s,'relief')&&!activeProject(s,'resettle'),
    'FIN-01':i.credit>0&&!activeProject(s,'escrow'),
    'POL-01':s.turn>=2&&!s.resolved.includes('POL-01'),
    'END-01':complete&&!f.durable&&!activeProject(s,'jointTreaty')&&!activeProject(s,'trusteeship')&&!activeProject(s,'bilateral'),
    'END-02':i.border>0&&(f.incident||s.turn>=3)&&!activeProject(s,'ceasefire')&&!activeProject(s,'phasedPeace'),
    'END-03':f.durable&&!f.managed&&i.agreement>0&&!activeProject(s,'handover')
  };
  return Boolean(map[id]);
}
export function availableEvents(s) {
  return EVENTS.filter(e=>isEligible(s,e.id)&&(s.cooldowns[e.id]||0)<=s.turn)
    .sort((a,b)=>priority(b,s)-priority(a,s));
}
function priority(e,s) { if(e.id==='SEC-04')return 100;if(e.id==='SEC-03')return 90;if(e.id==='HUM-01')return 80;if(e.random){const p=s.randomEvents.pending.find(p=>p.id===e.id);return p.deadline===s.turn?75:e.followOnly?58:35;}return e.id.startsWith('END')?65:e.id==='MIR-03'?60:e.id==='MIR-04'?55:e.id==='MIR-01'?50:30; }
export function optionReason(s,o) {
  if (s.status!=='playing')return '本届任期已结束';
  if(s.ap<o.ap)return '行动力不足';if(s.budget<o.budget)return '预算不足';if(s.influence<o.influence)return '影响力不足';
  const f=s.flags,complete=f.damFixed||f.alternative;
  const requirements={
    waterAid:[!activeProject(s,'waterAid')&&!activeProject(s,'waterAidExpiry'),'临时供水正在运输或仍在生效，请先落实长期方案'],
    repair:[tr(s,'HUI')>=35&&s.issues.energy===0,'需要灰岭信任 ≥35、岚原工业恢复'],
    alternative:[!activeProject(s,'alternative'),'替代供水工程已启动'],
    allocation:[tr(s,'CHI')>=40&&tr(s,'FENG')>=40,'赤峰与丰谷信任均需 ≥40'],
    corridor:[tr(s,'CHENG')>=40,'澄海信任需 ≥40，可先举行双边会谈'],
    landRoute:[tr(s,'CHI')>=45,'赤峰信任需 ≥45'],
    energyDeal:[s.issues.trade<=1&&tr(s,'FENG')>=45,'先保障航运（风险≤1）与丰谷信任（≥45）'],
    energyUpgrade:[s.issues.energy===0,'先恢复岚原工业'],
    civilEnergy:[f.energyDeal||tr(s,'YAO')>=45,'曜沙信任需 ≥45，或已有能源合作'],
    easeSanctions:[f.sanctions,'当前没有可以修订的能源制裁'],
    escrowPeace:[tr(s,'XING')>=55&&(f.hotline||f.energyDeal),'需要星湾信任 ≥55，以及热线或能源合作'],
    freezeBloc:[f.attackEvidence||f.energyDeal,'需要攻击责任证据或曜沙能源合作'],
    resettle:[tr(s,'XING')>=45&&tr(s,'FENG')>=45,'需要星湾与丰谷信任均 ≥45'],
    escrow:[tr(s,'XING')>=50,'星湾信任需 ≥50'],
    jointTreaty:[complete&&s.issues.border<=1&&['HUI','CHI','FENG'].every(id=>tr(s,id)>=40),'需要设施方案、边境≤1、三国信任均≥40'],
    trusteeship:[complete&&s.issues.border<=1&&tr(s,'HUI')>=35,'需要设施方案、边境≤1、灰岭信任≥35'],
    bilateral:[complete&&f.allocation&&s.issues.border<=1,'需要设施方案、配水安排、边境≤1'],
    ceasefire:[(['CHI','FENG'].every(id=>tr(s,id)>=40)||(f.energyDeal&&f.attackEvidence)),'需要双方信任均≥40，或能源合作和攻击证据'],
    phasedPeace:[tr(s,'XING')>=55,'需要星湾信任 ≥55'],
    pauseFight:[!f.pauseUsed,'临时停火已使用，请安排正式撤离'],
    handover:[complete,'需要完成设施方案'],
    shareCosts:[COUNTRIES.filter(c=>tr(s,c.id)>=50).length>=4,'需要至少 4 国信任 ≥50'],
    reduceMission:[complete&&f.allocation&&f.observers,'需要配水、观察与设施方案']
  };
  if(requirements[o.id]&&!requirements[o.id][0])return requirements[o.id][1];
  if(activeProject(s,o.id))return '这项工作已经在进行中';
  return '';
}
function incident(s) {
  if(!s.flags.incident){s.flags.incident=true;s.truth.attack=['local','CHI','FENG'][Math.floor(random(s)*3)];log(s,'边境枪声','先前预警的武装接触成为现实。热线、现场救援与独立证据可以阻止误判扩大。','danger');}
}
function actionEffect(s,key) {
  const f=s.flags;
  switch(key) {
    case 'wait':return '保留了行动力。现有危机仍会按局势演化。';
    case 'investigate':
      if(tr(s,'HUI')<35){trust(s,'HUI',5);return '灰岭暂不接受完整准入。外围测量提高了对话意愿；可先会谈再申请。';}
      f.access=true;project(s,'investigate','镜河联合调查',1);return '灰岭接受限期联合调查，现场小组将在本次结算提交证据。';
    case 'waterAid':project(s,'waterAid','临时供水运输',s.issues.trade>=2?2:1);return '供水运输已安排。运输不畅可能使交付延后；这是临时缓解。';
    case 'talkWater':
      trust(s,'CHI',6);trust(s,'FENG',5);
      if(tr(s,'HUI')<35)return '两国愿意继续谈判，但灰岭尚未接受数据共享，临时安排未能签署。';
      if(!f.allocation){issue(s,'water',-1);f.allocation=true;}return '各方接受最低供水的临时安排。闸门维修与长期治理仍待落实。';
    case 'withdraw':
      if(tr(s,'CHI')<50&&!f.hotline&&!f.energyDeal){trust(s,'CHI',4);return '赫连铎拒绝在没有监督或安全保证时撤军。先建立观察热线，或通过曜沙改变条件。';}
      issue(s,'border',-2);issue(s,'bloc',-1);trust(s,'CHI',5);trust(s,'FENG',5);f.peace=s.issues.border===0;return '双方接受对等降级。第三国合作与安全条件使这次撤离变得可信。';
    case 'observe':
      if(tr(s,'CHI')<30||tr(s,'FENG')<30)return '一方拒绝观察员准入。需要先修复双边信任，资金未用于部署。';
      f.observers=true;f.hotline=true;issue(s,'bloc',-1);return '观察员准入获得同意，热线建立。误判风险下降，可重新提出对等撤离。';
    case 'energyTalk':f.energyTopic=true;trust(s,'YAO',5);return '曜沙愿意交换条件。能源议题已开放，请查看「有条件的能源」。';
    case 'publish':f.report=true;s.credibility+=8;trust(s,'HUI',-8);return '报告已公开。公信力上升，但灰岭对委员会的信任受损；工程合作需要继续维护。';
    case 'repairPromise':f.report=true;trust(s,'HUI',10);s.promises.push({id:'repair',name:'完成灰岭水库整改',due:s.turn+3,fulfilled:false,broken:false});return '共同整改承诺已登记，需在第 '+(s.turn+3)+' 回合结束前修复水库。';
    case 'jointReport':f.report=true;s.credibility+=4;trust(s,'HUI',6);return '联合报告确认了责任与工程方案，各方能够在同一组事实下谈判。';
    case 'repair':project(s,'repair','灰岭水库联合维修',2);f.access=true;return '岚原工程队开始维修。项目需要两次结算，停工会使进度暂停。';
    case 'allocation':f.allocation=true;issue(s,'water',-1);trust(s,'CHI',3);trust(s,'FENG',3);return '最低供水条款签署。缺水有所缓解，设施与长期履约仍需落实。';
    case 'alternative':project(s,'alternative','分散储水与替代供水',3,2);return '替代供水建设启动。需要三次结算，每次维护预算 2。';
    case 'insurance':project(s,'insurance','粮船有限保险担保',1);return '担保已预留。承运将在本次结算恢复，高对峙可能导致实际索赔。';
    case 'corridor':project(s,'corridor','人道航运通道',1);trust(s,'CHENG',5);return '澄海接受通行检查安排，粮船将在本次结算恢复航行。';
    case 'landRoute':project(s,'landRoute','赤峰陆路过境运输',2);trust(s,'CHI',6);return '赤峰接受陆路过境。比海运慢一次结算，但增加了合作信任。';
    case 'civilEnergy':project(s,'civilEnergy','民用能源协调',1);return '曜沙接受民用供能安排，工业将在本次结算恢复。';
    case 'subsidy':s.issues.energy=0;project(s,'subsidyExpiry','车间临时补贴到期',2);return '关键车间恢复两次结算。请在补贴结束前协调持续能源。';
    case 'easeSanctions':return '请在议会审阅「民用能源豁免修正案」，最终按五票门槛决定。';
    case 'verifyAttack':project(s,'verifyAttack','边境责任独立调查',1);return '独立调查启动，将依据事件发生时的事实给出结论。';
    case 'freezeBloc':s.issues.bloc=0;trust(s,'YAO',4);return '灰岭与曜沙接受不扩大介入的安排。赤峰的部署仍需单独谈判。';
    case 'endorse':trust(s,'CHI',12);if(s.truth.attack!=='FENG')s.credibility-=10;issue(s,'bloc',1);return s.truth.attack==='FENG'?'支持与已存事实一致，但联盟介入压力增加。':'支持缺乏事实依据。公信力受损，联盟动员增加。';
    case 'energyDeal':f.energyDeal=true;f.civilEnergy=true;issue(s,'bloc',-1);trust(s,'YAO',8);trust(s,'CHI',-2);return '曜沙接受粮食交换并限制新增军用供能。赤峰现在更容易接受对等撤离。';
    case 'energyUpgrade':project(s,'energyUpgrade','曜沙储运升级合作',2);return '岚原设备升级方案已获接受。两次结算后能源合作生效。';
    case 'sanctionDraft':return '已转入能源制裁草案，请审阅票数、期限与民用豁免。';
    case 'hotline':f.hotline=true;issue(s,'border',-1);return '双方指挥机构取得联系，互相确认停止追加开火。';
    case 'rescueEvidence':project(s,'rescueEvidence','边境救援与证据保全',1);return '救援小组出发。现场证据会为攻击责任调查提供依据。';
    case 'blame':trust(s,'FENG',8);trust(s,'CHI',-12);if(s.truth.attack!=='CHI')s.credibility-=12;return s.truth.attack==='CHI'?'谴责与实际责任一致，但赤峰谈判意愿下降。':'现场事实不支持这一归责。公信力下降，需要独立核验与修复信任。';
    case 'escrowPeace':f.escrow=true;f.hotline=true;issue(s,'border',-2);issue(s,'bloc',-1);return '星湾托管保证与对等撤离安排达成，最后通牒暂时解除。';
    case 'hardline':
      if(f.energyDeal&&s.issues.bloc<=1){issue(s,'border',-1);trust(s,'FENG',6);return '赤峰判断补给成本过高，暂停进一步升级。威慑奏效，但仍需正式停火。';}
      s.issues.border=4;issue(s,'bloc',1);issue(s,'human',2);f.war=true;f.everWar=true;incident(s);return '对方没有退让。强硬支持促使双方交战，居民开始撤离；停火和救援现在都很紧迫。';
    case 'interveneDraft':return '已打开有限干预授权草案。授权需要五票，执行另需预算与实际条件。';
    case 'relief':project(s,'relief','营地紧急救援',s.issues.trade>=2?2:1);return '救援物资已调拨，运输情况决定一至两次结算后交付。';
    case 'resettle':project(s,'resettle','多国自愿安置',2);return '星湾与丰谷接受分担安排，两次结算落实接收。';
    case 'humanCorridor':issue(s,'trade',-1);f.hotline=true;return '人道通道开放，运输压力降低。物资与安置仍需投入。';
    case 'escrow':project(s,'escrow','贸易托管与分期清算',1);f.escrow=true;return '星湾开始按交付托管支付，信用风险将在本次结算缓解。';
    case 'guarantee':s.issues.credit=0;project(s,'guarantee','有限担保到期核验',3);return '担保缓解了信用压力。三次结算后核验航运恢复，决定担保损失。';
    case 'haircut':s.issues.credit=0;trust(s,'CHENG',-5);trust(s,'YAO',-5);return '各方接受缩单，但损失降低了曜沙与澄海对委员会的信任。';
    case 'openCouncil':return '议会已开放。查看立场免费，游说与正式表决消耗行动力。';
    case 'jointSponsor':trust(s,'HUI',8);trust(s,'LAN',8);return '灰岭与岚原愿意共同讨论提案。实际投票取决于条款。';
    case 'transparent':s.credibility+=5;trust(s,'XING',6);return '执行与资金公开，星湾对程序的信任增加。';
    case 'jointTreaty':project(s,'jointTreaty','镜河联合治理首轮履约',2);s.issues.agreement=Math.max(1,s.issues.agreement);return '三国签署共同治理，首轮履约需要两次结算。';
    case 'trusteeship':project(s,'trusteeship','限期中立托管',2,2);s.issues.agreement=Math.max(1,s.issues.agreement);return '限期托管启动，完成供水后还须交接维护能力。';
    case 'bilateral':project(s,'bilateral','双边配水合同核验',1);return '双边合同条款相容，本次结算核验履约。';
    case 'ceasefire':project(s,'ceasefire','停火与对等撤军',2);f.hotline=true;f.observers=true;s.issues.border=Math.min(1,s.issues.border);return '各方下达停火命令，中立观察员核验两次结算后的撤离。';
    case 'phasedPeace':project(s,'phasedPeace','托管保证与分阶段撤离',2);f.hotline=true;f.escrow=true;return '星湾开始逐步核验。各方每完成一步，另一方履行对应步骤。';
    case 'pauseFight':f.pauseUsed=true;f.hotline=true;issue(s,'border',-1);return '临时停止追加战斗并交换人员。需继续安排正式撤离。';
    case 'handover':project(s,'handover','本地人员培训与交接',1);return '培训与交接已启动，本次结算核验维护能力。';
    case 'shareCosts':f.managed=true;s.issues.agreement=0;return '四国以上接受长期分担，临时执行缺口关闭。';
    case 'reduceMission':f.managed=true;s.issues.agreement=0;return '已有配水、观察和维修保障，冗余任务安全退出。';
    default:throw new Error('未知行动。');
  }
}
function normalise(s) {
  s.credibility=clamp(s.credibility);s.influence=clamp(s.influence,0,99);s.budget=clamp(s.budget,0,999);
  for(const k of Object.keys(ISSUES))s.issues[k]=clamp(s.issues[k],0,k==='border'?4:3);
  if(s.issues.water===0&&!s.flags.durable)s.issues.agreement=Math.max(1,s.issues.agreement);
  if(s.flags.durable&&s.issues.border===0)s.issues.bloc=0;
  for(const e of availableEvents(s)) if(s.firstSeen[e.id]===undefined)s.firstSeen[e.id]=s.turn;
  return s;
}
export function chooseEvent(state,id,optionId) {
  const s=copy(state);const event=EVENTS.find(e=>e.id===id);need(event&&availableEvents(s).some(e=>e.id===id),'这个事件当前不可处理。');
  const option=event.options.find(o=>o.id===optionId);need(option,'未知选项。');const reason=optionReason(s,option);need(!reason,reason);
  spend(s,option.budget,option.influence,option.ap);
  const before=crisis(s);const randomResult=event.random?resolveRandom(s,event,option):null;const note=randomResult?randomResult.message:actionEffect(s,option.id);
  if(option.id==='observe'&&!s.flags.observers)s.budget+=option.budget;
  s.cooldowns[id]=event.random?(option.id==='wait'?s.turn+1:s.turn):s.turn+2;
  if(optionId!=='wait'&&['SEC-03','SEC-04','POL-01'].includes(id))s.resolved.push(id);
  normalise(s);
  log(s,event.title+' · '+option.title,note+(event.random?' '+describeChanges(state,s):''),option.id==='hardline'?'danger':'action');
  return {state:s,message:note,speaker:event.speaker,response:randomResult?.response,changes:describeChanges(state,s),delta:crisis(s)-before,navigate:{openCouncil:'council',sanctionDraft:'council',interveneDraft:'council',easeSanctions:'council'}[optionId],proposal:{sanctionDraft:'sanctions',interveneDraft:'intervention',easeSanctions:'exemption'}[optionId]};
}
function describeChanges(before,after){const changes=[],add=(label,n)=>{if(n)changes.push(label+(n>0?' +':' ')+n);};for(const [key,label] of [['budget','预算'],['influence','影响力'],['credibility','公信力'],['ap','行动力']])add(label,after[key]-before[key]);for(const c of COUNTRIES)add(c.short+'信任',after.countries[c.id].trust-before.countries[c.id].trust);add('世界危机',crisis(after)-crisis(before));return changes.length?'实际变化：'+changes.join('；')+'。':'本次没有即时数值变化。';}
export function diplomacy(state,id,mode='talk') {
  const s=copy(state);need(COUNTRIES.some(c=>c.id===id),'未知国家。');
  const key=`${id}-${mode}`;need(!s.lobbied[key],'本回合已进行过这项外交行动。');
  let message;
  if(mode==='talk'){spend(s,0,2);trust(s,id,10);message='交换诉求并确认合作边界，信任 +10。';}
  else if(mode==='aid'){spend(s,4,0);trust(s,id,14);s.credibility+=1;message='专项民生援助落实，信任 +14、公信力 +1。';}
  else if(mode==='fund'){need(tr(s,id)>=60,'该国信任需要达到 60 才愿意提供专项拨款。');spend(s,0,3);s.budget+=7;trust(s,id,-5);message='取得预算 7 的公开专项拨款，信任 -5。';}
  else throw new Error('未知外交方式。');
  s.lobbied[key]=true;log(s,COUNTRIES.find(c=>c.id===id).short+'双边外交',message,'action');normalise(s);return {state:s,message,speaker:id,changes:describeChanges(state,s),response:{talk:'我们的诉求已经说清楚了。这次对话让我更愿意继续合作。',aid:'这批援助会交给民生部门。谢谢你们把承诺落实下来。',fund:'这笔拨款已经获准，请公开它的用途和执行结果。'}[mode]};
}
export function projectedVotes(s,proposalId,safeguards=true) {
  const p=PROPOSALS.find(p=>p.id===proposalId);need(p,'未知议案。');
  return COUNTRIES.map(c=>{
    let score=tr(s,c.id)+(s.credibility-50)*0.3;let reason='委员会信任与执行可信度';
    if(safeguards){score+=8;reason='明确期限、公开监督与民用保障';}
    if(p.id==='observers'){if(c.bloc==='sea'||c.id==='XING')score+=12;if(c.id==='CHI'&&!s.flags.hotline)score-=10;reason=c.id==='CHI'?'需要对等安排与可信的准入条款':reason;}
    if(p.id==='repairFund'){if(['LAN','FENG','HUI'].includes(c.id))score+=14;if(!s.flags.evidence)score-=15;reason=s.flags.evidence?'调查证据支持共同维修':'缺少独立故障证据';}
    if(p.id==='aidFund'){score+=10;if(s.issues.human===0)score-=8;reason='支持自愿分担，但重视实际需求';}
    if(p.id==='sanctions'){if(c.bloc==='land')score-=22;if(c.id==='CHI')score-=15;if(c.id==='FENG')score+=16;if(c.id==='LAN'&&!safeguards)score-=18;if(s.flags.attackEvidence&&s.truth.attack==='CHI')score+=12;reason=c.bloc==='land'?'担忧同盟责任与能源损失':'需要证据与民用保障';}
    if(p.id==='intervention'){score-=12;if(c.id==='CHI')score-=18;if(s.flags.attackEvidence)score+=12;reason=s.flags.attackEvidence?'核实证据降低干预的不确定性':'缺少责任证据，担忧授权扩大';}
    if(p.id==='exemption'){score+=12;reason='支持恢复民用供应与限期复审';}
    return {id:c.id,score:Math.round(score),vote:score>=60?'yes':score>=45?'abstain':'no',reason};
  });
}
export function vote(state,proposalId,safeguards=true) {
  const s=copy(state),p=PROPOSALS.find(p=>p.id===proposalId);need(p,'未知议案。');
  need(s.votesThisTurn===0,'每回合只能进行一次正式表决。');
  need(!s.passed.includes(proposalId),'这项授权已经通过。');
  if(proposalId==='exemption')need(s.flags.sanctions,'目前没有能源制裁需要修订。');
  if(proposalId==='repairFund'){need(s.flags.evidence,'请先获取故障证据。');need(!s.flags.damFixed&&!activeProject(s,'repair'),'维修已完成或正在执行。');}
  need(s.budget>=p.cost,'预算不足以执行该议案。');spend(s,0,0);s.votesThisTurn++;
  const votes=projectedVotes(s,proposalId,safeguards),count=votes.filter(v=>v.vote==='yes').length,threshold=p.type==='major'?5:4;
  let message;
  if(count<threshold){message=`${count} 票赞成，未达到 ${threshold} 票。未扣执行预算；可调整条款或先改善关系。`;}
  else {
    s.passed.push(proposalId);s.budget-=p.cost;s.credibility+=3;
    if(proposalId==='observers'){
      if(tr(s,'CHI')>=35&&tr(s,'FENG')>=35){s.flags.observers=true;s.flags.hotline=true;issue(s,'border',-1);issue(s,'bloc',-1);message='授权通过，双方接受限期准入。观察与热线开始执行。';}
      else {s.budget+=p.cost;s.passed=s.passed.filter(x=>x!==proposalId);message='议案获得支持，但一方拒绝准入，未部署且执行预算已退回。请先修复信任。';}
    } else if(proposalId==='repairFund'){
      if(tr(s,'HUI')>=35&&s.issues.energy===0){s.flags.access=true;project(s,'repair','议会水利修复基金',2);message='基金获批，灰岭接受准入，工程将在两次结算后完成。';}
      else {s.budget+=p.cost;s.passed=s.passed.filter(x=>x!==proposalId);message='授权通过，但灰岭准入或岚原工程能力不足。未扣执行预算，请解决条件后重提。';}
    } else if(proposalId==='aidFund'){issue(s,'human',-2);issue(s,'trade',-1);message='共同救援获批，成员落实物资与人道通道。';}
    else if(proposalId==='sanctions'){s.flags.sanctions=true;issue(s,'bloc',-2);issue(s,'border',-1);issue(s,'energy',safeguards?1:2);trust(s,'YAO',-8);project(s,'sanctionsExpiry','能源制裁到期复审',3);message='制裁执行，动员成本上升。岚原工业受到外溢影响，三次结算后复审到期。';}
    else if(proposalId==='exemption'){s.flags.civilEnergy=true;s.issues.energy=0;message='民用能源豁免执行，岚原工业恢复，军用限制保留至到期。';}
    else {s.flags.hotline=true;s.flags.observers=true;project(s,'phasedPeace','议会授权停火执行',2);message='成员提供执行力量，限期监督与分阶段停火开始，完成需两次结算。';}
    message=`${count} 票赞成，议案通过。${message}`;
  }
  log(s,p.title+' · 表决',message,'vote');normalise(s);return {state:s,message,votes,passed:count>=threshold};
}
function completeProject(s,p) {
  const f=s.flags;
  switch(p.type){
    case 'investigate':f.evidence=true;return '证据确认：旱情、闸门故障和中游取水共同导致短缺。报告可进一步审议。';
    case 'waterAid':issue(s,'water',-1);project(s,'waterAidExpiry','临时供水结束',2);return '临时供水交付，短缺下降一级，效果持续两次结算。';
    case 'waterAidExpiry':if(!f.durable&&!f.damFixed&&!f.alternative)issue(s,'water',1);return '临时供水结束，按当前设施与协议重新核对缺口。';
    case 'repair':f.damFixed=true;issue(s,'water',-1);s.credibility+=5;trust(s,'HUI',5);s.issues.agreement=Math.max(1,s.issues.agreement);return '闸门恢复运行。需要落实长期配水和维护安排，执行缺口已显示。';
    case 'alternative':f.alternative=true;issue(s,'water',-2);s.issues.agreement=Math.max(1,s.issues.agreement);return '替代供水设施建成，仍需签署长期配水与维护合同。';
    case 'insurance':s.issues.trade=0;if(s.issues.border<3){s.budget+=3;return '粮船到货，未用担保返还预算 3。';}return '粮船到货，但高风险索赔消耗了全部担保。';
    case 'corridor':case 'landRoute':s.issues.trade=0;return '物资通道恢复，粮食能够按合同交付。';
    case 'civilEnergy':f.civilEnergy=true;s.issues.energy=0;return '民用能源恢复，岚原工程能力恢复。';
    case 'subsidyExpiry':if(!f.civilEnergy&&f.sanctions)issue(s,'energy',1);return '临时转产补贴结束，持续供能决定工业能否维持。';
    case 'energyUpgrade':f.energyDeal=true;f.civilEnergy=true;issue(s,'bloc',-1);trust(s,'YAO',8);return '曜沙收到设备，履行供能合作。赤峰的追加动员面临更高成本。';
    case 'verifyAttack':case 'rescueEvidence':f.attackEvidence=true;if(p.type==='rescueEvidence')issue(s,'human',-1);return '独立核验：'+({CHI:'赤峰一支部队率先越界。',FENG:'丰谷巡逻队率先越界。',local:'基层未经授权的接触引发误击，未发现中央进攻命令。'}[s.truth.attack]||'当前没有可归责的跨境武力事件。');
    case 'relief':issue(s,'human',-2);return '救援物资完成交付，营地基本需求改善。';
    case 'resettle':s.issues.human=0;return '自愿接收与基本服务落实，安置缺口关闭。';
    case 'escrow':s.issues.credit=0;return '托管合同开始按交付结算，信用风险关闭。';
    case 'guarantee':if(s.issues.trade===0){s.budget+=3;return '贸易恢复，担保预算返还 3。';}return '贸易仍受阻，担保已用于承担约定损失。';
    case 'jointTreaty':case 'bilateral':f.durable=true;f.managed=true;f.allocation=true;s.issues.water=0;s.issues.agreement=0;return '供水、维护与核验安排完成首轮履约，长期风险关闭。';
    case 'trusteeship':f.durable=true;f.allocation=true;s.issues.water=0;s.issues.agreement=1;return '托管供水达标。请完成维护能力交接，关闭最后的执行缺口。';
    case 'ceasefire':case 'phasedPeace':s.issues.border=0;s.issues.bloc=0;f.peace=true;f.war=false;return '撤军经核实完成，边境与联盟动员解除。居民安置仍需另行解决。';
    case 'handover':f.managed=true;s.issues.agreement=0;return '本地人员完成维护演练，委员会安全交接。';
    case 'sanctionsExpiry':f.sanctions=false;if(!f.civilEnergy)issue(s,'energy',-1);return '限期制裁到期，相关供应恢复。后续对抗按当前局势判断。';
    default:throw new Error('不支持的项目类型');
  }
}
export function endTurn(state) {
  const s=copy(state);need(s.status==='playing','本届任期已结束。');const before=crisis(s),existingHistory=new Set(s.history);
  const pending=[...s.projects];s.projects=[];
  for(const p of pending){
    if(p.type==='repair'&&s.issues.energy>0){s.projects.push(p);log(s,p.name+'暂停','岚原工业受阻，需恢复能源。已支付工程预算不会重复扣除。','danger');continue;}
    if(s.budget<p.maintenance){s.projects.push(p);log(s,p.name+'等待拨款',`维护预算不足 ${p.maintenance}，进度暂停，可在委员会寻求拨款。`,'danger');continue;}
    s.budget-=p.maintenance;p.remaining--;
    if(p.remaining<=0)log(s,p.name+'完成',completeProject(s,p),'good');else s.projects.push(p);
  }
  for(const p of s.promises){if(p.fulfilled||p.broken)continue;if(p.id==='repair'&&s.flags.damFixed){p.fulfilled=true;s.credibility+=4;log(s,'整改承诺兑现','按期完成水库维修，公信力 +4。','good');}else if(s.turn>=p.due){p.broken=true;s.credibility-=8;trust(s,'HUI',-6);log(s,'整改承诺逾期','未按期修复水库，公信力 -8、灰岭信任 -6。工程仍可继续。','danger');}}
  const i=s.issues,f=s.flags;
  if(!f.durable&&!f.damFixed&&!f.alternative&&s.turn%3===0&&i.water>0){issue(s,'water',1);log(s,'供水缺口扩大','故障尚未修复，持续旱情增加了短缺。','danger');}
  if(!f.peace&&!f.observers&&!f.hotline&&s.turn>=3&&s.turn%2===1&&i.border>0){issue(s,'border',1);log(s,'边境部署升级','缺少热线与观察，双方把对方部署视为威胁。可通过中立观察或第三国调解降级。','danger');if(i.border>=3)incident(s);}
  if(i.border===4&&!f.war){f.war=true;f.everWar=true;issue(s,'human',2);issue(s,'bloc',1);log(s,'对峙转为交战','最后的缓和窗口未能落实，居民开始撤离。停火与救援均可发起。','danger');}
  if(i.border>=3&&f.incident&&!f.attackEvidence&&s.turn>=5&&s.turn%3===2){issue(s,'bloc',1);log(s,'盟约压力增加','攻击责任仍不明确，成员担忧安全。独立归责可以为暂缓介入提供依据。','danger');}
  if(i.trade>=2&&s.turn>=4&&s.turn%3===1){issue(s,'credit',1);log(s,'贸易延期影响清算','未能交付的订单增加信用风险，星湾可以协调托管。','danger');}
  if(i.trade>=2&&s.turn===5&&!f.civilEnergy){issue(s,'energy',1);log(s,'岚原出现供应停工','持续运输阻碍开始影响工业与维修能力。','danger');}
  if(s.turn===2)log(s,'边境预警','若持续缺少观察或热线，下一次结算可能发生部署升级。','danger');
  if(s.turn===4&&i.trade>=2)log(s,'供应预警','运输若仍受阻，下一次结算可能影响岚原工业。','danger');
  normalise(s);
  s.lowTrustTurns=s.credibility<15?s.lowTrustTurns+1:0;
  const after=crisis(s);s.trajectory.push(after);
  if(after===0){s.status='won';s.ending=f.everWar?'战后的和平':s.passed.includes('sanctions')?'审慎的秩序':'共同的和平';}
  else if(after>=100){s.status='lost';s.ending='世界局势失控';}
  else if(s.lowTrustTurns>=3){s.status='lost';s.ending='委员会被解散';}
  else if(s.turn>=s.limit){s.status='lost';s.ending='任期结束，和平尚未完成';}
  if(s.status==='playing')advanceRandom(s,s.turn+1,log);
  const entries=s.history.filter(h=>!existingHistory.has(h));
  s.lastReport={turn:s.turn,before,after,entries:entries.map(x=>({...x})),income:s.status==='playing'?6:0};
  if(s.status==='playing'){s.turn++;s.ap=3;s.budget+=6;s.influence+=3;s.votesThisTurn=0;s.lobbied={};normalise(s);}
  else log(s,s.ending,s.status==='won'?'所有当前危机来源已经关闭。七国仍有分歧，但和平拥有了可以执行的安排。':'复盘你的决定与未解决来源，下一届任期可以尝试不同路线。',s.status==='won'?'good':'danger');
  return {state:s,message:s.status==='playing'?`进入第 ${s.turn} 回合，预算 +6、影响力 +3。`:s.ending};
}
const PROJECT_TYPES=['investigate','waterAid','waterAidExpiry','repair','alternative','insurance','corridor','landRoute','civilEnergy','subsidyExpiry','energyUpgrade','verifyAttack','rescueEvidence','relief','resettle','escrow','guarantee','jointTreaty','bilateral','trusteeship','ceasefire','phasedPeace','handover','sanctionsExpiry'];
export function validateSave(value) {
  need(value&&typeof value==='object'&&value.version===VERSION,'存档版本不兼容。');
  const s=copy(value);if(s.flags&&s.flags.everWar===undefined)s.flags.everWar=Boolean(s.flags.war||s.history?.some(h=>h.title==='对峙转为交战'));const base=createGame();
  function shape(v,ref,depth=0){need(depth<20,'存档结构无效。');if(Array.isArray(ref)){need(Array.isArray(v),'存档列表损坏。');return;}if(ref&&typeof ref==='object'){need(v&&typeof v==='object'&&!Array.isArray(v),'存档结构损坏。');for(const k of Object.keys(ref))shape(v[k],ref[k],depth+1);return;}if(ref===null)return;need(typeof v===typeof ref,'存档字段类型不正确。');if(typeof ref==='number')need(Number.isFinite(v)&&Number.isInteger(v),'存档数值无效。');}
  initRandom(s);shape(s,base);validateRandom(s);
  need(s.turn>=1&&s.turn<=24&&s.limit===24&&s.ap>=0&&s.ap<=3,'存档回合或行动力无效。');
  need(['playing','won','lost'].includes(s.status),'存档状态无效。');
  need(s.budget>=0&&s.budget<=999&&s.influence>=0&&s.influence<=99&&s.credibility>=0&&s.credibility<=100,'存档资源无效。');
  for(const k of Object.keys(ISSUES))need(s.issues[k]>=0&&s.issues[k]<=(k==='border'?4:3),'存档危机来源无效。');
  for(const c of COUNTRIES)need(tr(s,c.id)>=0&&tr(s,c.id)<=100,'存档国家信任无效。');
  need(s.projects.length<=40&&s.history.length<=160&&s.promises.length<=20,'存档内容过大。');
  for(const p of s.projects)need(p&&PROJECT_TYPES.includes(p.type)&&typeof p.name==='string'&&Number.isInteger(p.remaining)&&p.remaining>0&&p.remaining<=10&&Number.isInteger(p.maintenance)&&p.maintenance>=0&&p.maintenance<=10,'存档项目无效。');
  need(new Set(s.projects.map(p=>p.type)).size===s.projects.length,'存档项目重复。');
  for(const h of s.history)need(h&&typeof h.title==='string'&&typeof h.text==='string'&&Number.isInteger(h.turn),'存档记录无效。');
  for(const p of s.promises)need(p&&p.id==='repair'&&Number.isInteger(p.due)&&typeof p.fulfilled==='boolean'&&typeof p.broken==='boolean','存档承诺无效。');
  for(const dict of ['cooldowns','firstSeen'])for(const [id,n] of Object.entries(s[dict]))need(EVENTS.some(e=>e.id===id)&&Number.isInteger(n)&&n>=0&&n<=30,'存档事件时间无效。');
  for(const id of s.resolved)need(EVENTS.some(e=>e.id===id),'存档事件无效。');
  for(const id of s.passed)need(PROPOSALS.some(p=>p.id===id),'存档议案无效。');
  need(s.trajectory.length<=25&&s.trajectory.every(n=>Number.isFinite(n)&&n>=0&&n<=100),'存档走势无效。');
  need([null,'CHI','FENG','local'].includes(s.truth.attack),'存档事实无效。');
  s.lastReport=null;
  return normalise(s);
}
