import {platform} from './mobile-platform.js';
export function createFeedback(getPreferences){
 let context;
 async function tone(preview=false){
  const p=getPreferences();if(p.muted||p.volume===0||document.hidden)return false;
  try{
   const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;
   context??=new Audio();if(context.state==='suspended')await context.resume();
   if(context.state!=='running')return false;
   const now=context.currentTime,osc=context.createOscillator(),gain=context.createGain();
   osc.type='sine';osc.frequency.setValueAtTime(preview?660:520,now);osc.frequency.exponentialRampToValueAtTime(preview?880:390,now+.07);
   gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.075*p.volume/100,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+(preview?.18:.07));
   osc.connect(gain);gain.connect(context.destination);osc.start(now);osc.stop(now+(preview?.2:.08));
   osc.onended=()=>{osc.disconnect();gain.disconnect();};return true;
  }catch{return false;}
 }
 return {
  press(){void tone();if(getPreferences().vibration&&platform.canVibrate()){try{platform.vibrate();}catch{}}},
  preview(){return tone(true);},
  suspend(){if(context?.state==='running')void context.suspend().catch(()=>{});}
 };
}
