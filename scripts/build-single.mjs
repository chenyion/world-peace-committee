import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {COUNTRIES} from '../dist/data.js';
const root=new URL('../',import.meta.url),dist=new URL('dist/',root);
const [html,css,theme,settingsCss,emblem,...scripts]=await Promise.all(['index.html','phone.css','atelier.css','settings.css','emblem.svg','random-events.js','data.js','engine.js','preferences.js','mobile-platform.js','feedback.js','settings-ui.js','leader-assets.js','atlas.js','map-touch.js','visuals.js','phone-ui.js'].map(name=>readFile(new URL(name,dist),'utf8')));
const embeddedEmblem='data:image/svg+xml;base64,'+Buffer.from(emblem).toString('base64');
let js=scripts.map(source=>source.replace(/^import .*?;\r?\n/gm,'').replace(/^export \{.*?\};?\r?\n/gm,'').replace(/^export /gm,'')).join('\n').replaceAll('./emblem.svg',embeddedEmblem);
await mkdir(new URL('assets/leaders/',dist),{recursive:true});
const images=await Promise.all(COUNTRIES.map(async c=>{const source=new URL(`assets/leaders/${c.id}.png`,dist);return [c.id,await readFile(source)];}));
for(const [id,data] of images)js=js.replaceAll(`./assets/leaders/${id}.png`,'data:image/png;base64,'+data.toString('base64'));
const standalone=html.replace('<link rel="stylesheet" href="./phone.css">',`<style>${css}</style>`)
 .replace('<link rel="stylesheet" href="./atelier.css">',`<style>${theme}</style>`)
 .replace('<link rel="stylesheet" href="./settings.css">',`<style>${settingsCss}</style>`)
 .replace('<script type="module" src="./phone-ui.js"></script>',()=>`<script type="module">${js.replaceAll('</script','<\\/script')}</script>`)
 .replace('href="./emblem.svg"',`href="${embeddedEmblem}"`);
await writeFile(new URL('世界和平委员会.html',root),standalone,'utf8');
console.log('Built 世界和平委员会.html');
