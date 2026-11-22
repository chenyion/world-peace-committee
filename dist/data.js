import {RANDOM_EVENTS} from './random-events.js';
export const COUNTRIES = [
  {id:'LAN',name:'岚原共和国',short:'岚原',leader:'林序',role:'议政长',bloc:'sea',color:'#6ca1b5',resource:'工业 · 工程',trust:60,military:3,economy:5,quote:'请告诉我，这项决议明天由谁执行。',goal:'维持能源与粮食进口，避免工业停摆。',line:'不会接受让核心工业停摆的全面能源禁运。',offer:'工程队与设备可修复灰岭水库。',x:178,y:205},
  {id:'CHI',name:'赤峰联邦',short:'赤峰',leader:'赫连铎',role:'联邦执政官',bloc:'land',color:'#c98572',resource:'陆路 · 安全',trust:35,military:5,economy:3,quote:'下一次炮声响起时，谁会来？',goal:'获得对等安全保证，维持边境运输。',line:'拒绝缺乏对等监督的单方面撤军。',offer:'开放陆路与撤军，是最直接的降温手段。',x:332,y:203},
  {id:'CHENG',name:'澄海共同体',short:'澄海',leader:'闻澜',role:'首席执政官',bloc:'sea',color:'#71b3aa',resource:'港口 · 航运',trust:55,military:2,economy:4,quote:'货船会绕开炮火，账单不会。',goal:'保持通航，控制保险与港口就业风险。',line:'不接受核心港口被无限期军事接管。',offer:'协调救援通道，恢复粮船运输。',x:539,y:246},
  {id:'FENG',name:'丰谷联盟',short:'丰谷',leader:'穗宁',role:'轮值理事长',bloc:'sea',color:'#c7b976',resource:'粮食 · 农业',trust:55,military:2,economy:3,quote:'我解释不了空掉的粮仓。',goal:'保障灌溉与口粮，维持公平粮价。',line:'拒绝危及关键农季的长期配水方案。',offer:'粮食出口是争取曜沙的重要筹码。',x:355,y:349},
  {id:'HUI',name:'灰岭公国',short:'灰岭',leader:'塞芙琳',role:'摄政公爵',bloc:'land',color:'#a59bc5',resource:'水源 · 矿产',trust:40,military:1,economy:2,quote:'援助不应成为另一种控制。',goal:'修复水利设施，同时保留自主权。',line:'拒绝没有期限和退出机制的设施托管。',offer:'调查准入与上游流量数据能揭示危机根源。',x:378,y:90},
  {id:'YAO',name:'曜沙王国',short:'曜沙',leader:'萨弥尔',role:'王储兼内阁首席',bloc:'land',color:'#c9a274',resource:'能源 · 资金',trust:45,military:3,economy:4,quote:'谁来保证明天的饭？',goal:'用稳定能源出口换取粮食与设备。',line:'拒绝无限期低价供能或全面冻结资金。',offer:'限制新增军用供能，可提高赤峰动员成本。',x:160,y:351},
  {id:'XING',name:'星湾共和国',short:'星湾',leader:'叶衡',role:'联席议长',bloc:'neutral',color:'#b7c6cb',resource:'调解 · 清算',trust:70,military:1,economy:3,quote:'规则不能只在方便时才有效。',goal:'维护中立与信用，防止连锁违约。',line:'拒绝没有依据与申诉程序的资产扣押。',offer:'托管支付与中立会址能够让承诺可信。',x:522,y:399}
];
export const BLOCS = {sea:'环海协作同盟',land:'大陆安全协约',neutral:'中立成员'};
export const ISSUES = {
 border:{name:'边境对峙',weight:8,help:'调解、对等撤军或停火可以降低。'},
 water:{name:'供水短缺',weight:6,help:'修复设施并达成配水或替代供水安排。'},
 bloc:{name:'联盟动员',weight:5,help:'安全保证、能源谈判与中立监督。'},
 trade:{name:'航运受阻',weight:4,help:'救援通道、保险担保或陆路运输。'},
 energy:{name:'工业停工',weight:4,help:'恢复民用供能或实施短期转产。'},
 credit:{name:'履约与信用',weight:4,help:'星湾托管、分期支付或处理债务。'},
 human:{name:'人道压力',weight:5,help:'援助、安置与安全返回。'},
 agreement:{name:'执行缺口',weight:3,help:'完成监督、配水协议与项目交接。'}
};
const o = (id,title,detail,budget=0,influence=0,ap=1) => ({id,title,detail,budget,influence,ap});
const wait = () => o('wait','暂不介入','保存行动力。问题仍按世界状态演变，2 回合后可再次审议。',0,0,0);
export const EVENTS = [
 {id:'MIR-01',title:'低于警戒线的水位',kind:'资源危机',countries:['HUI','CHI','FENG'],speaker:'FENG',quote:'我们收到的是解释，田里需要的是水。',text:'镜河下游的水位持续下降。丰谷指责赤峰截流，灰岭则坚称上游水库一切正常。各国的声明之间，缺少一份共同认可的事实。',options:[o('investigate','发起联合调查','争取灰岭准入。1 次结算后取得故障证据；低信任时仅能获得外围测量。',3),o('waterAid','紧急运水','缓解供水短缺一级，维持 2 次结算；运输不畅会延误。',6),o('talkWater','召开配水会谈','争取临时配水安排，降低短缺；灰岭仍需信任保障。',0,3),wait()]},
 {id:'MIR-02',title:'边境车站的灯',kind:'安全预警',countries:['CHI','FENG','YAO'],speaker:'CHI',quote:'我们不能把边境安全交给一句承诺。',text:'赤峰的运输车在午夜进入边境车站。丰谷开始追加巡逻。双方都声称只是在防御，而新增的部署正在缩短谈判窗口。',options:[o('withdraw','提出对等撤离','需要赤峰信任达到 50，或先建立热线、能源安排。接受后双方降低部署。',0,3),o('observe','部署中立观察员','争取双方准入，建立热线。降低误判风险，并让撤军变得可谈。',4),o('energyTalk','转向曜沙谈判','开放能源交换议题，先从第三国改变赤峰的动员成本。',0,2),wait()]},
 {id:'MIR-03',title:'封存的检修报告',kind:'调查发现',countries:['HUI','LAN','FENG'],speaker:'HUI',quote:'公开真相之前，请先确保有人能修好它。',text:'调查确认：闸门故障、旱情与中游取水共同导致低水位。被封存的报告还记录了维护经费缺口。揭露责任与恢复供水，是两件不同的事。',options:[o('publish','公开报告与技术证据','公信力 +8，灰岭信任 -8。解锁工程；仍需重新确认合作。',2),o('repairPromise','限期共同整改','保留灰岭参与，信任 +10。建立 3 回合维修承诺，违约将损害公信力。',0,2),o('jointReport','联合说明并公开招标','公信力 +4，灰岭信任 +6。获得维修合作框架。',4),wait()]},
 {id:'MIR-04',title:'不是一条河的问题',kind:'工程与分配',countries:['HUI','LAN','CHI','FENG'],speaker:'LAN',quote:'工程图已经准备好，我们还需要通行和资金。',text:'故障可以修复，但修复后的水应该怎样分配？岚原愿意提供技术；灰岭要求保留管理权；丰谷要求最低供水；赤峰关心城市与铁路。',options:[o('repair','启动联合维修','需灰岭信任 35、岚原工业正常。2 次结算修复闸门，供水短缺降低一级。',8),o('allocation','先签最低供水安排','需赤峰与丰谷信任均达 40。降低短缺，但闸门故障仍须解决。',0,4),o('alternative','建设分散供水设施','绕开单一设施依赖。3 次结算完成，每次维护费 2；仍需长期执行协议。',6),wait()]},
 {id:'TRA-01',title:'粮船拒保',kind:'贸易危机',countries:['CHENG','FENG','LAN'],speaker:'CHENG',quote:'船已经装满，保险公司却撤回了承诺。',text:'粮食堆在码头，新的战争风险附加费让航次无法出发。岚原和曜沙都在等待粮食，延误也会改变它们在议会中的态度。',options:[o('insurance','设立有限保险担保','预留预算 5。1 次结算恢复承运；无索赔时返还 3，持续高对峙将消耗全部担保。',5),o('corridor','协调人道航运通道','澄海信任至少 40 即可协商。1 次结算降低运输风险。',2,3),o('landRoute','争取赤峰陆路过境','赤峰信任至少 45。2 次结算恢复运输，并改善双方关系。',3,2),wait()]},
 {id:'TRA-02',title:'停工的第三班',kind:'供应连锁',countries:['LAN','YAO','HUI'],speaker:'LAN',quote:'没有燃料，工程队也无法离开工厂。',text:'能源供应中断，岚原暂停了部分生产。原定发往灰岭的维修设备也被滞留。帮助岚原，可能是在解决上游水库问题。',options:[o('civilEnergy','协调民用能源豁免','与曜沙有合作或信任达到 45 时，1 次结算恢复工业。',0,3),o('subsidy','资助关键车间转产','维持工程能力 2 次结算，为供应谈判争取时间。',6),o('easeSanctions','撤回过宽的制裁','仅适用于已通过的能源制裁。需在议会表决修订；此处转入议会。',0,0,0),wait()]},
 {id:'SEC-01',title:'协约的第五条',kind:'联盟危机',countries:['CHI','HUI','YAO'],speaker:'YAO',quote:'共同防御不等于共同承担任何一次冒险。',text:'赤峰援引共同防御条款。灰岭和曜沙要求解释攻击责任。盟约是否被启动，将影响这场冲突的规模。',options:[o('verifyAttack','独立核验攻击责任','1 次结算获得事件发生时已确定的事实，不按玩家立场改写。',3),o('freezeBloc','争取暂缓扩大介入','需要公开归责证据或曜沙合作。接受后降低联盟动员两级。',0,4),o('endorse','支持共同防御主张','赤峰信任 +12。若证据不支持其主张，公信力 -10；其他成员仍自行判断。',0,2),wait()]},
 {id:'SEC-02',title:'有条件的能源',kind:'外交筹码',countries:['YAO','CHI','FENG'],speaker:'YAO',quote:'先给我一份能够兑现的粮食承诺。',text:'曜沙可以调整新增军用能源交付，但不愿牺牲民用合同与粮食安全。它提出：保障进口粮食，才有重新谈判能源的余地。',options:[o('energyDeal','粮食换取军民供应分离','需航运风险≤1、丰谷信任≥45。提高赤峰动员成本，并解锁更容易的撤军谈判。',0,3),o('energyUpgrade','以设备升级换取合作','需岚原工业正常。2 次结算后达成能源合作，不依赖粮食通道。',6),o('sanctionDraft','起草限期能源制裁','转入重大议案。需要 5 票与执行资金；会冲击民用供应。',0,0,0),wait()]},
 {id:'SEC-03',title:'雾里的第一声枪响',kind:'紧急事件',countries:['CHI','FENG'],speaker:'CHI',quote:'我们的前线正在等待一条明确的命令。',text:'边境传来枪声。相互矛盾的报告迅速扩散。现场究竟发生了什么，在冲突发生时已经确定；现在你需要决定先做什么。',options:[o('hotline','建立紧急指挥热线','降低当前对峙一级，阻止本次误判继续扩大；不决定责任归属。',0,2),o('rescueEvidence','救治伤员并保存证据','1 次结算获得攻击责任证据，缓解人道压力。',4),o('blame','立即谴责被指控的赤峰','丰谷信任 +8。真实责任不符时会损害公信力及赤峰信任。'),wait()]},
 {id:'SEC-04',title:'最后通牒的午夜',kind:'最后通牒',countries:['CHI','FENG','XING'],speaker:'FENG',quote:'请让他们知道，退让也必须是对等的。',text:'双方的部署已经超过日常防卫。最后通牒要求在下一次结算前给出回应。你可以提供妥协条件，也可以支持一次危险的强硬回应。',options:[o('escrowPeace','对等退让与中立托管','需星湾信任≥55，并已有热线或能源合作。争取降低部署，暂缓战争。',3,4),o('hardline','支持强硬回应','按补给与动员条件产生威慑或升级。可能引发交战和居民撤离。',0,3),o('interveneDraft','提出有限干预授权','转入重大议案，需要 5 票、预算与成员提供执行力量。',0,0,0),wait()]},
 {id:'HUM-01',title:'边境的临时营地',kind:'人道救援',countries:['FENG','CHI','XING'],speaker:'FENG',quote:'他们需要的是今晚就能到达的物资。',text:'撤离的居民正在临时营地等待安置。停火能阻止新增伤害，却不能代替食物、住房与安全返回的安排。',options:[o('relief','紧急运送救援物资','1 次结算降低人道压力两级。航道仍受阻时额外延误一次。',5),o('resettle','争取多国共同安置','星湾与丰谷信任至少 45 时，2 次结算完成自愿安置。',0,3),o('humanCorridor','先开放人道通道','建立通道并缓解一级航运风险；随后仍需援助。',0,2),wait()]},
 {id:'FIN-01',title:'未完成的清算',kind:'金融与履约',countries:['XING','CHENG','YAO'],speaker:'XING',quote:'信用的缺口，会比一艘粮船传播得更快。',text:'受阻的贸易使付款延期。星湾提出由中立账户托管交付，但成员国必须承担各自的成本。否则，下一批物资也可能被暂停。',options:[o('escrow','协调托管分期支付','星湾信任至少 50 时，1 次结算降低信用风险，并建立托管机制。',2,2),o('guarantee','提供有限紧急担保','立即缓解信用风险。3 回合内恢复航运可返还 3，否则担保损失记入账本。',6),o('haircut','协调缩单与减记','降低信用风险；曜沙与澄海承担损失，对委员会信任各 -5。',0,3),wait()]},
 {id:'POL-01',title:'四张赞成票',kind:'议会程序',countries:['XING','LAN','HUI'],speaker:'XING',quote:'写下谁来执行，也写下由谁承担。',text:'第一个议案已经进入讨论。国家不会只因你提出和平就同意；条款的成本、期限和对本国的影响，决定它们的票。',options:[o('openCouncil','审阅议案与七国立场','进入议会，自由查看各国理由；阅读不消耗行动力。',0,0,0),o('jointSponsor','争取跨阵营共同提案','改善灰岭与岚原的信任，各 +8；不直接购买投票。',0,3),o('transparent','公开资金与执行范围','公信力 +5，星湾信任 +6。后续票数仍按实际条款计算。',2),wait()]},
 {id:'END-01',title:'镜河共同委员会',kind:'和平建设',countries:['HUI','CHI','FENG'],speaker:'HUI',quote:'让河流被共同照看，而不是被谁占有。',text:'临时缓和需要一套可持续的安排。无论成立共同机构、限期托管，还是相容的双边合同，关键都是供水、维护和监督真正落地。',options:[o('jointTreaty','签署三国联合治理协议','需设施已修复或替代供水已完成、边境≤1，三国信任≥40。2 次结算后关闭供水与执行风险。',4,4),o('trusteeship','限期中立托管','需设施方案完成、边境≤1、灰岭信任≥35。2 次结算达标，但还需完成项目交接。',6,3),o('bilateral','衔接双边配水合同','需设施方案完成、配水协议、边境≤1。成本低，1 次结算完成；仍需各国履约。',2,2),wait()]},
 {id:'END-02',title:'停火后的第一夜',kind:'停火与监督',countries:['CHI','FENG','XING'],speaker:'CHI',quote:'命令可以今晚下达，信任需要被看见。',text:'双方愿意考虑新的停火条件。先停止交火，再确认撤离与监督。资源争端与受影响居民，仍需要单独处理。',options:[o('ceasefire','对等撤离与中立观察','需双方信任≥40，或能源合作与已确认攻击证据。1 次结算停止交火，2 次结算解除部署。',4,4),o('phasedPeace','分阶段撤离与托管保证','需星湾信任≥55。资金与撤离按阶段核验，2 次结算降低边境到 0。',3,3),o('pauseFight','暂停战斗并交换人员','当回合降低边境一级，建立热线。只提供临时缓和，不能重复刷到永久和平。',2,2),wait()]},
 {id:'END-03',title:'最后一笔维护费',kind:'项目交接',countries:['HUI','LAN','XING'],speaker:'LAN',quote:'能独立运行的那一天，才是工程真正完成。',text:'临时托管已接近目标。留下什么样的维护能力，决定委员会撤出以后，供水与监督能否继续。',options:[o('handover','培训本地人员并交接','完成设施方案后，1 次结算建立本地维护能力并关闭执行缺口。',3),o('shareCosts','协调多国分担长期服务','需至少 4 国信任≥50。各方签署分担方案后，关闭临时执行缺口。',0,3),o('reduceMission','缩为必要监测任务','需已有配水、观察和设施方案，关闭冗余临时项目。',1),wait()]}
];
EVENTS.push(...RANDOM_EVENTS);
export const PROPOSALS = [
 {id:'observers',title:'镜河中立观察任务',type:'ordinary',cost:4,desc:'双方同意后派出观察员，建立热线，降低边境与联盟动员。'},
 {id:'repairFund',title:'跨国水利修复基金',type:'ordinary',cost:8,desc:'取得灰岭准入后资助维修，岚原提供工程能力；完成需 2 次结算。'},
 {id:'aidFund',title:'共同人道援助计划',type:'ordinary',cost:4,desc:'协调运输与自愿安置，缓解人道和航运压力。'},
 {id:'sanctions',title:'限期军用能源制裁',type:'major',cost:3,desc:'提高动员成本，同时可能影响岚原的民用工业。需要 5 票。'},
 {id:'intervention',title:'有限停火干预授权',type:'major',cost:8,desc:'以观察、停火和明确退出期限为目标；需实际执行条件。'},
 {id:'exemption',title:'民用能源豁免修正案',type:'major',cost:0,desc:'修订现有能源制裁，恢复民用供应，保留核验与期限。'}
];
