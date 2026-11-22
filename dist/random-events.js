// 独立随机流：阅读与重载不抽签，事件发生时固定潜在结果。
const randomOption=(id,title,detail,effect={},budget=0,influence=0,follow=null)=>({id,title,detail,effect,budget,influence,ap:1,follow});
const randomWait=()=>({id:'wait',title:'暂缓答复',detail:'不消耗行动力，保留此事至期限。逾期后机会关闭，发言国信任 -2。',budget:0,influence:0,ap:0});
const randomEvent=(id,title,speaker,countries,quote,text,need,line,issue,options,followOnly=false)=>({id,title,speaker,countries,quote,text,dialogue:{need,line},issue,options:[...options,randomWait()],random:true,followOnly,kind:followOnly?'后续来函':'随机来函'});
export const RANDOM_EVENTS=[
 randomEvent('RND-01','港口的最后一班工人','CHENG',['CHENG','FENG'],'我可以协调船期，但不能替工人答应一切。','港口工人要求补发危险津贴。一批粮船即将靠港，船商希望委员会先担保、后谈条件。','先保障工人津贴，再让粮船通行。','无限期担保会把商业损失转给公众。','trade',[
  randomOption('r01-pay','共同支付临时津贴','预算 -4；澄海信任 +7，航运风险 -1；下回合收到资金核验来函。',{trust:{CHENG:7},issues:{trade:-1}},4,0,'FUP-01'),
  randomOption('r01-talk','安排工人与船商会谈','影响力 -2；70% 达成轮班协议（航运 -1、澄海信任 +4），30% 谈判暂缓（澄海信任 +2）。',{},0,2),
  randomOption('r01-pressure','要求优先放行粮船','航运风险 -1，澄海信任 -7、丰谷信任 +4；下回合需回应工人的申诉。',{issues:{trade:-1},trust:{CHENG:-7,FENG:4}},0,1,'FUP-01')]),
 randomEvent('RND-02','雨季前的旧闸门','HUI',['HUI','LAN','FENG'],'我需要技术人员，也需要本国参与每一次检查。','灰岭维护员发现旧闸门渗漏。外部工程队可以提供零件，但地方议会担心临时检查演变为长期接管。','让本地维护员与外部工程队共同检查。','维修许可不能被解释为永久托管。','water',[
  randomOption('r02-parts','提供零件与本地培训','预算 -4；灰岭与岚原信任各 +6，公信力 +2；下回合进入零件分配分支。',{trust:{HUI:6,LAN:6},credibility:2},4,0,'FUP-02'),
  randomOption('r02-data','协商公开检修数据','影响力 -2；公信力 +3、灰岭信任 +3；不等于完成水库维修。',{credibility:3,trust:{HUI:3}},0,2),
  randomOption('r02-take','要求外部独立接管检查','公信力 +2、灰岭信任 -8；下回合仍需决定零件与维护责任。',{credibility:2,trust:{HUI:-8}},0,1,'FUP-02')]),
 randomEvent('RND-03','停火线上的婚礼','CHI',['CHI','FENG','XING'],'他们只想在两家人面前完成婚礼。别让这成为新的误判。','停火线两侧的家庭申请短时通行。赤峰指挥官担心出现不明人员，丰谷居民希望委员会提供见证。','可核验的名单、时间和返回安排。','不能把通行许可变成无监督的边境缺口。','border',[
  randomOption('r03-escort','安排中立护送','预算 -3；赤峰与丰谷信任各 +5，边境风险 -1。',{trust:{CHI:5,FENG:5},issues:{border:-1}},3),
  randomOption('r03-local','交给地方联络员','影响力 -1；60% 顺利通行（双方信任 +6），40% 名单争议（双方信任 -3，开启见证人分支）。',{},0,1),
  randomOption('r03-delay','说明理由并延期','赤峰信任 +3、丰谷信任 -4；此次申请关闭。',{trust:{CHI:3,FENG:-4}})]),
 randomEvent('RND-04','丰收之后的出口票','FENG',['FENG','YAO','CHENG'],'粮仓里的数字，还不是每个家庭的口粮。','丰谷地方议会准备重新分配粮食出口额度。曜沙愿意预付能源，但部分农户要求先建立国内最低储备。','保留国内最低口粮，并让出口收益到达农户。','不能用下一季的生计担保无限期供货。','water',[
  randomOption('r04-reserve','补助国内储备','预算 -4；丰谷信任 +8、人道压力 -1。',{trust:{FENG:8},issues:{human:-1}},4),
  randomOption('r04-swap','协调限期粮能交换','影响力 -3；丰谷、曜沙信任各 +5；下回合核验合同，不自动替代主线能源协议。',{trust:{FENG:5,YAO:5}},0,3,'FUP-04'),
  randomOption('r04-market','允许船商竞价购买','委员会获得公开手续费预算 +3；丰谷信任 -6、澄海信任 +4。',{budget:3,trust:{FENG:-6,CHENG:4}})]),
 randomEvent('RND-05','工程师的联名信','LAN',['LAN','HUI'],'我们能修好机器，但得先知道谁承担维护。','岚原工程师愿意分享旧设备图纸。设备商要求保护专利，灰岭则担心维修一结束就再次失去技术支持。','给工程师明确的许可与维护经费。','不能让临时援助变成没有报酬的无限任务。','energy',[
  randomOption('r05-license','购买公共维修许可','预算 -4；岚原与灰岭信任各 +6；下回合收到维护分配来函。',{trust:{LAN:6,HUI:6}},4,0,'FUP-02'),
  randomOption('r05-exchange','建立限期技术交流','影响力 -2；岚原信任 +5，公信力 +2。',{trust:{LAN:5},credibility:2},0,2),
  randomOption('r05-publish','要求无偿公开全部图纸','灰岭信任 +7、岚原信任 -8；公信力 -2。',{trust:{HUI:7,LAN:-8},credibility:-2})]),
 randomEvent('RND-06','沙港的储罐警报','YAO',['YAO','LAN','CHENG'],'今天少装一船，可能比明天失去整座码头更划算。','曜沙发现储罐温度异常。暂停装船可以排查风险，按原计划出口则能维持本期现金流。','让排查与民用供应同时获得保障。','不能无限期停运，却没有替代安排。','energy',[
  randomOption('r06-inspect','资助紧急排查','预算 -4；曜沙信任 +7，工业风险 -1；下回合核验供应合同。',{trust:{YAO:7},issues:{energy:-1}},4,0,'FUP-04'),
  randomOption('r06-reroute','协调备用码头','影响力 -3；曜沙与澄海信任各 +4、航运风险 -1。',{trust:{YAO:4,CHENG:4},issues:{trade:-1}},0,3),
  randomOption('r06-continue','接受继续装船的提议','50% 平安交付（预算 +4、曜沙信任 +3）；50% 小规模泄漏（工业风险 +1、曜沙信任 -5）。',{})]),
 randomEvent('RND-07','中立港外的请愿','XING',['XING','FENG','CHI'],'中立不是让本地居民独自承担所有费用。','星湾居民要求公开会议与安置支出。有人主张关闭临时接待点，也有人提出让七国按能力共同分担。','给居民看得到的账本和成本分担。','不能靠秘密冻结他国资金解决预算。','human',[
  randomOption('r07-grant','提供公开民生补助','预算 -4；星湾信任 +8、人道压力 -1。',{trust:{XING:8},issues:{human:-1}},4),
  randomOption('r07-audit','召开公开听证','影响力 -2；星湾信任 +5、公信力 +3；下回合进入公开账本分支。',{trust:{XING:5},credibility:3},0,2,'FUP-01'),
  randomOption('r07-close','支持缩减接待规模','预算 +3，星湾信任 +2、丰谷信任 -6、人道压力 +1。',{budget:3,trust:{XING:2,FENG:-6},issues:{human:1}})]),
 randomEvent('RND-08','午夜电台的传闻','XING',['XING','CHI','FENG'],'广播里的声音很响，但还不能代替证据。','匿名电台宣称一国准备袭击粮船。商人开始询问是否停航，边境居民要求立刻作出回应。','先核实消息来源，再向公众说明。','未经核验的指控不应成为授权依据。','border',[
  randomOption('r08-verify','邀请中立记者核验','影响力 -2；公信力 +3、星湾信任 +4；下回合出现见证人分支。',{credibility:3,trust:{XING:4}},0,2,'FUP-03'),
  randomOption('r08-joint','争取双方共同澄清','影响力 -3；65% 发布共同声明（边境 -1、双方信任 +4），35% 措辞谈判失败（公信力 -2）。',{},0,3),
  randomOption('r08-repeat','转述传闻要求赤峰解释','丰谷信任 +5、赤峰信任 -8、公信力 -4。',{trust:{FENG:5,CHI:-8},credibility:-4})]),
 randomEvent('FUP-01','公开账本上的空白','CHENG',['CHENG','XING'],'你们要求的账本已经送来，有一笔支出还缺签名。','此前的协调促成了账目公开，但一笔紧急支出缺少凭证。如何补证，将影响各方是否愿意继续分担。','补齐凭证并让受影响者得到回应。','程序缺口不能被直接当作定罪结论。','credit',[
  randomOption('f01-audit','独立复核并公示','预算 -2；公信力 +5、星湾信任 +4。',{credibility:5,trust:{XING:4}},2),
  randomOption('f01-repay','先赔付受影响者','预算 -4；澄海信任 +7、信用风险 -1。',{trust:{CHENG:7},issues:{credit:-1}},4),
  randomOption('f01-seal','暂时封存争议账目','预算 +2、公信力 -5、星湾信任 -4。',{budget:2,credibility:-5,trust:{XING:-4}})],true),
 randomEvent('FUP-02','只够一处使用的零件','HUI',['HUI','LAN','FENG'],'零件到了，但两处设施都在等。','此前争取的技术支持已经抵达。库存只够优先处理一处：上游闸门，或下游抽水站。两国都希望委员会说明依据。','让零件先到最需要的地方，并解释排序。','不能把优先顺序变成永久的利益分配。','water',[
  randomOption('f02-up','优先上游闸门','灰岭信任 +7、丰谷信任 -3；仅提供技术准备，主线维修仍需执行。',{trust:{HUI:7,FENG:-3}}),
  randomOption('f02-down','优先下游抽水站','供水短缺 -1，丰谷信任 +6、灰岭信任 -4。',{issues:{water:-1},trust:{FENG:6,HUI:-4}}),
  randomOption('f02-buy','追加采购并联检修','预算 -5；两国信任各 +5，公信力 +2。',{trust:{HUI:5,FENG:5},credibility:2},5)],true),
 randomEvent('FUP-03','见证人的第二份证词','CHI',['CHI','FENG','XING'],'请把证词核对完整，再决定由谁道歉。','此前的联络与核验发现，一位见证人的时间记录前后不一致。双方等待委员会公布下一步安排。','交叉核对记录，保护证人正常陈述。','不能用一份有争议的证词确认攻击责任。','border',[
  randomOption('f03-cross','交叉核验与共同说明','影响力 -2；公信力 +4、双方信任各 +4，不直接获得主线攻击证据。',{credibility:4,trust:{CHI:4,FENG:4}},0,2),
  randomOption('f03-protect','先安置见证人','预算 -3；人道压力 -1、星湾信任 +5。',{issues:{human:-1},trust:{XING:5}},3),
  randomOption('f03-blame','要求赤峰先行道歉','丰谷信任 +5、赤峰信任 -9、公信力 -3。',{trust:{FENG:5,CHI:-9},credibility:-3})],true),
 randomEvent('FUP-04','重新报价的交付合同','YAO',['YAO','FENG','LAN'],'我能保证交付，但条件也必须能被执行。','此前的供应安排进入合同阶段。额外检验推高运输成本，买卖双方各自提出了新的付款条件。','按实际交付分期付款，分担新增成本。','不能先收走全部货物，再讨论付款责任。','credit',[
  randomOption('f04-share','分担额外运输费','预算 -3；曜沙与丰谷信任各 +5、航运风险 -1。',{trust:{YAO:5,FENG:5},issues:{trade:-1}},3),
  randomOption('f04-escrow','协调分期托管交付','影响力 -3；信用风险 -1、曜沙与星湾信任各 +4。',{issues:{credit:-1},trust:{YAO:4,XING:4}},0,3),
  randomOption('f04-cancel','取消本次额外合同','预算 +2、曜沙与丰谷信任各 -5；不撤销已生效的主线能源安排。',{budget:2,trust:{YAO:-5,FENG:-5}})],true)
];
const randomOutcomes={
 'r01-talk':[{chance:.7,effect:{issues:{trade:-1},trust:{CHENG:4}},text:'工人与船商达成轮班协议，粮船获得通行窗口。',reply:'这次大家愿意各退一步，先让粮船入港。'},{effect:{trust:{CHENG:2}},text:'双方愿意继续谈，但本轮没有恢复额外通行。',reply:'我会继续协调，但现在还不能承诺船期。'}],
 'r03-local':[{chance:.6,effect:{trust:{CHI:6,FENG:6}},text:'地方联络员完成名单核对，两家人安全团聚。',reply:'他们已经安全返回。这样的安排可以被信任。'},{effect:{trust:{CHI:-3,FENG:-3}},follow:'FUP-03',text:'名单出现争议，通行暂缓，下回合核对见证记录。',reply:'先把名单查清楚，别让家属承担误判的代价。'}],
 'r06-continue':[{chance:.5,effect:{budget:4,trust:{YAO:3}},text:'本批货物平安交付，委员会获得公开运输协作费 4。',reply:'本批交付完成了，储罐排查仍应认真对待。'},{effect:{issues:{energy:1},trust:{YAO:-5}},text:'储罐发生小规模泄漏，临时停运推高工业供能风险。',reply:'装船已经暂停。我们得先处理泄漏。'}],
 'r08-joint':[{chance:.65,effect:{issues:{border:-1},trust:{CHI:4,FENG:4}},text:'双方同意共同澄清，边境误判压力下降。',reply:'共同声明已经公布，请让证据继续说话。'},{effect:{credibility:-2},text:'双方未能就措辞达成一致，委员会的沟通信誉受损。',reply:'措辞还没有谈拢，不能把沉默当作承认。'}]
};
export function initRandom(s){if(s.randomEvents===undefined)s.randomEvents={rng:(s.seed^0x9e3779b9)>>>0||1,pending:[],queued:[],seen:[]};return s.randomEvents;}
function eventRoll(r){let n=r.rng;n^=n<<13;n^=n>>>17;n^=n<<5;r.rng=n>>>0;return r.rng/4294967296;}
function addRandom(s,e,turn,cause,log){const r=initRandom(s);r.seen.push(e.id);r.pending.push({id:e.id,turn,deadline:turn+2,roll:eventRoll(r),cause});log?.(s,'新来函 · '+e.title,`${cause?`源于「${cause}」。`:''}请在第 ${turn+2} 回合结束前答复；逾期机会关闭，发言国信任 -2。`,'info');}
export function spawnRandom(s,turn=s.turn,force=false,log){const r=initRandom(s);if(r.pending.length>=2||(!force&&eventRoll(r)>.65))return;const pool=RANDOM_EVENTS.filter(e=>!e.followOnly&&!r.seen.includes(e.id));if(!pool.length)return;const weights=pool.map(e=>1+(s.issues[e.issue]>0?3:0)+(s.countries[e.speaker].trust<45?1:0));let n=eventRoll(r)*weights.reduce((a,b)=>a+b,0);const e=pool.find((_,i)=>(n-=weights[i])<0)||pool.at(-1);addRandom(s,e,turn,'',log);}
export function advanceRandom(s,nextTurn,log){const r=initRandom(s);r.pending=r.pending.filter(p=>{if(p.deadline>=nextTurn)return true;const e=RANDOM_EVENTS.find(e=>e.id===p.id);s.countries[e.speaker].trust=Math.max(0,s.countries[e.speaker].trust-2);log(s,'来函逾期 · '+e.title,'答复窗口关闭，发言国信任 -2；这项额外机会不再出现。','danger');return false;});for(const q of [...r.queued]){if(q.due>nextTurn||r.pending.length>=2)continue;r.queued.splice(r.queued.indexOf(q),1);if(!r.seen.includes(q.id))addRandom(s,RANDOM_EVENTS.find(e=>e.id===q.id),nextTurn,q.cause,log);}spawnRandom(s,nextTurn,false,log);}
export function resolveRandom(s,e,o){const r=initRandom(s),p=r.pending.find(p=>p.id===e.id);if(!p)throw Error('这封来函已经关闭。');if(o.id==='wait')return {message:`下回合可再次答复，最晚至第 ${p.deadline} 回合结束。逾期发言国信任 -2。`,response:'我会等待答复，但这个窗口不会一直开放。'};
 const outcomes=randomOutcomes[o.id];let selected;if(outcomes){let n=p.roll;selected=outcomes.find(x=>(n-=(x.chance??1))<0)||outcomes.at(-1);}const effect=selected?.effect||o.effect;
 for(const [id,n] of Object.entries(effect.trust||{}))s.countries[id].trust=Math.min(100,Math.max(0,s.countries[id].trust+n));
 for(const [key,n] of Object.entries(effect.issues||{}))s.issues[key]=Math.min(key==='border'?4:3,Math.max(0,s.issues[key]+n));
 for(const key of ['budget','influence','credibility'])s[key]+=effect[key]||0;
 const follow=selected?.follow||o.follow;let continuation='';if(follow&&!r.seen.includes(follow)&&!r.queued.some(q=>q.id===follow)){r.queued.push({id:follow,due:s.turn+1,cause:e.title});continuation=' 后续来函已安排，最早下回合抵达。';}
 r.pending=r.pending.filter(x=>x.id!==e.id);s.resolved.push(e.id);
 return {message:(selected?.text||`${o.title}已落实。`)+continuation,response:selected?.reply||((effect.trust?.[e.speaker]||0)<0?'我已收到决定，但这与我们的诉求仍有分歧。后续合作需要重新讨论。':({LAN:'执行条件已经明确，我们会据此安排工程与技术部门。',CHENG:'我已收到决定，港口会按这次安排协调。',HUI:'我们会记录这项安排，也会继续关注执行边界。',CHI:'我已确认答复，接下来要看承诺如何执行。',FENG:'我会向地方议会说明这次决定及其代价。',YAO:'条件已经清楚，我会通知负责交付的部门。',XING:'这项决定将进入公开记录，适用同样的核验程序。'}[e.speaker]))};}
export function validateRandom(s){const r=initRandom(s),ids=RANDOM_EVENTS.map(e=>e.id),valid=()=>{throw Error('存档随机来函无效。');};if(!Number.isInteger(r.rng)||r.rng<1||r.rng>4294967295||!Array.isArray(r.pending)||!Array.isArray(r.queued)||!Array.isArray(r.seen)||r.pending.length>2||r.queued.length>4||r.seen.length>12)valid();if(new Set(r.seen).size!==r.seen.length||r.seen.some(id=>!ids.includes(id)))valid();for(const p of r.pending)if(!p||!r.seen.includes(p.id)||s.resolved.includes(p.id)||!Number.isInteger(p.turn)||p.turn<1||p.turn>s.turn||!Number.isInteger(p.deadline)||p.deadline!==p.turn+2||p.deadline<s.turn||typeof p.roll!=='number'||!Number.isFinite(p.roll)||p.roll<0||p.roll>=1||typeof p.cause!=='string'||p.cause.length>100)valid();for(const q of r.queued)if(!q||!RANDOM_EVENTS.some(e=>e.id===q.id&&e.followOnly)||r.seen.includes(q.id)||!Number.isInteger(q.due)||q.due<1||q.due>25||typeof q.cause!=='string'||q.cause.length>100)valid();if(new Set(r.pending.map(p=>p.id)).size!==r.pending.length||new Set(r.queued.map(p=>p.id)).size!==r.queued.length)valid();}
