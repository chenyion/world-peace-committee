export function createSettingsViews(api){
 const {button,dialogLayout,modalHead,modalFoot,esc}=api;
 const foot=()=>modalFoot(api.isPaused()?button('help','玩法指南','secondary'):button('exit','退出游戏','secondary'),button('close',api.isPaused()?'返回主菜单':'返回游戏'));
 function settingsView(v){
  const p=api.getPreferences(),section=v.section||'preferences',id=v.slot||'1',entry=api.getSlot(id),state=api.getState();
  const tabs=`<div class="segmented settings-tabs">${[['preferences','偏好设置'],['slots','存档 / 读档']].map(([key,label])=>`<button data-action="settings" data-section="${key}" class="${section===key?'selected':''}" aria-pressed="${section===key}">${label}</button>`).join('')}</div>`;
  const preferences=`<section class="setting-block"><div class="setting-label"><strong>文字大小</strong><span>立即生效</span></div><div class="segmented font-picker">${[['normal','标准'],['large','大号'],['extra','特大']].map(([key,label])=>`<button data-action="font-size" data-font="${key}" class="${p.font===key?'selected':''}" aria-pressed="${p.font===key}">${label}</button>`).join('')}</div><p class="font-sample">和平，从每一个选择开始。</p></section>
   <section class="setting-block"><div class="setting-label"><label for="settings-volume">音效音量</label><output id="volume-value" for="settings-volume">${p.muted?'静音':p.volume+'%'}</output></div><input id="settings-volume" type="range" min="0" max="100" step="5" value="${p.volume}" aria-label="音效音量"><div class="sound-buttons">${button('mute',p.muted?'开启声音':'静音','secondary',`aria-pressed="${p.muted}"`)}${button('preview-sound','试听提示音','secondary')}</div></section>
   <section class="setting-block feedback-options"><label><span>按键高亮</span><input id="settings-press" type="checkbox" ${p.press?'checked':''}></label><label><span>轻触振动 <small>${api.canVibrate()?'设备支持时生效':'当前设备不支持'}</small></span><input id="settings-vibration" type="checkbox" ${p.vibration?'checked':''} ${!api.canVibrate()?'disabled':''}></label></section>
   <p class="settings-status" id="preference-status" role="status">${esc(api.getNotice()||'设置会在本机记住。')}</p>`;
  const valid=entry.kind==='valid',backup=id==='backup',name=backup?'读档前备份':'存档 '+id;
  const archive=`<div class="segmented slot-picker" aria-label="选择存档位">${['1','2','3','backup'].map(key=>`<button data-action="settings" data-section="slots" data-slot="${key}" class="${id===key?'selected':''}" aria-pressed="${id===key}">${key==='backup'?'备份':'存档 '+key}</button>`).join('')}</div>
   <section class="slot-card"><small>${name}</small><h3>${valid?'第 '+entry.state.turn+' 回合':entry.kind==='invalid'?'存档暂时无法读取':'尚无存档'}</h3><p>${valid?`世界种子 ${entry.state.seed} · ${entry.state.actionCount} 次决策`:(backup?'读档前自动备份当前任期。':'保存当前进度，随时继续。')}</p><small>${valid?esc(new Date(entry.savedAt).toLocaleString('zh-CN',{hour12:false})):'手动存档独立保留。'}</small></section>
   <div class="slot-actions">${button('slot-save','保存到此处','secondary',`data-slot="${id}" ${backup||!api.hasSession()?'disabled':''}`)}${button('slot-load','读取此档','primary',`data-slot="${id}" ${valid?'':'disabled'}`)}</div>
   <p class="settings-status" role="status">${esc(v.notice||api.getWarning()||(api.hasSession()?`第 ${state.turn} 回合 · 行动后自动保存`:'尚未开始游戏，可先读取已有档案。'))}</p>
   <div class="slot-actions">${button('export','导出文件','secondary',api.hasSession()?'':'disabled')}${button('import','导入文件','secondary')}</div><p class="settings-hint">导出文件可用于跨设备恢复。</p>`;
  return dialogLayout(modalHead('GAME SETTINGS','游戏设置').replace('</header>',button('help','?','settings-guide','aria-label="玩法指南"')+'</header>'),`${tabs}<div class="settings-content ${section==='slots'?'slots-content':'preferences-content'}">${section==='slots'?archive:preferences}</div>`,foot(),'settings-dialog');
 }
 function slotConfirmView(v){
  return dialogLayout(modalHead('SAVE ARCHIVE',`覆盖存档 ${v.slot}？`),'<p class="narrative">该存档位已有记录。确认后，用当前任期替换此存档。</p><div class="info-note">其他手动存档位和自动存档不受影响。</div>',modalFoot(button('settings','取消','secondary',`data-section="slots" data-slot="${v.slot}"`),button('confirm-slot-save','确认覆盖','primary',`data-slot="${v.slot}"`)),'slot-confirm-dialog');
 }
 function exitView(){
  return dialogLayout(modalHead('END SESSION','退出本次游玩？'),`<div class="guide-art">◈</div><p class="narrative">保存当前任期，返回游戏标题页。下次可以继续游玩。</p><div class="info-note">${api.isNative()?'返回主菜单后，再按系统返回键可退出应用。':'当前为网页版；返回标题后，可关闭浏览器标签离开。'}</div>`,modalFoot(button('settings','继续游玩','secondary'),button('confirm-exit','保存并退出')),'exit-dialog');
 }
 function titleScreen(){
  const saved=api.hasSession(),state=api.getState(),ended=state.status!=='playing';
  return `<div class="app-shell title-screen"><div class="title-emblem"><img src="./emblem.svg" alt="委员会徽记"></div><div class="title-heading"><small>WORLD PEACE COMMITTEE</small><h1>世界和平委员会</h1><p>七国之间，和平由你书写。</p><span class="title-chapter">第一章 · 镜河之争</span></div><div class="title-actions" aria-label="游戏主菜单">${button('new','开始游戏',saved?'secondary':'primary')}${button('resume',saved&&ended?'查看上次任期':'继续游戏',saved?'primary':'secondary',saved?'':'disabled')}${button('settings','读取存档','secondary','data-section="slots"')}${button('settings','游戏设置','secondary')}</div><p class="title-status">${api.getWarning()?'\u81ea\u52a8\u5b58\u6863\u65e0\u6cd5\u8bfb\u53d6\uff0c\u8bf7\u9009\u62e9\u5176\u4ed6\u6863\u6848\u3002':saved?`上次进度 · 第 ${state.turn} 回合 · ${state.actionCount} 次决策`:'尚无自动存档 · 开始你的第一届任期'}</p></div>`;
 }
 return {settingsView,slotConfirmView,exitView,titleScreen};
}
