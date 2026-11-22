import {COUNTRIES} from './data.js';

// Edge offsets are symmetric, so neighbouring countries share the same boundary.
function coastline(points){
 const vertices=[...points.matchAll(/(-?\d+)\s+(-?\d+)/g)].map(m=>[+m[1],+m[2]]);
 return vertices.map(([x,y],i)=>{
  const [nx,ny]=vertices[(i+1)%vertices.length],dx=nx-x,dy=ny-y,length=Math.hypot(dx,dy);
  const offset=((x+nx+y+ny)%7-3)*.65;
  return `${i?'':'M'+x+' '+y} L${x+dx*.32-dy/length*offset} ${y+dy*.32+dx/length*offset} ${x+dx*.68+dy/length*offset} ${y+dy*.68-dx/length*offset} ${nx} ${ny}`;
 }).join('')+'Z';
}
const boundaries={
HUI:'M288 34 333 20 356 31 382 25 426 45 448 75 440 111 410 135 361 127 328 145 285 120 267 81Z',
LAN:'M86 127 142 100 195 112 230 146 222 186 247 221 216 257 155 270 111 244 91 204 65 180Z',
CHI:'M230 146 285 120 328 145 361 127 410 135 437 183 419 227 373 252 322 262 274 244 247 221 222 186Z',
CHENG:'M437 183 470 149 503 165 540 153 569 188 576 226 607 247 584 278 568 315 525 329 502 295 456 288 419 227Z',
FENG:'M274 244 322 262 373 252 419 227 456 288 438 326 464 352 441 386 395 410 351 399 318 414 280 381 256 341 269 299 243 275Z',
YAO:'M111 244 155 270 216 257 243 275 269 299 256 341 280 381 245 422 196 438 168 417 125 420 91 389 72 343 83 303Z',
XING:'M497 365 523 362 541 382 558 394 548 421 517 433 493 416 485 391Z M562 429 572 423 583 434 575 447 564 444Z M480 444 491 442 496 453 482 459Z'
};

const atlasGeometry=Object.fromEntries(Object.entries(boundaries).map(([id,path])=>[id,path.split(/(?=M)/).filter(Boolean).map(coastline).join(' ')]));
const atlasPalette={LAN:'#a9b9ac',CHI:'#c4a28a',CHENG:'#9cbdb4',FENG:'#c4c59d',HUI:'#b5b1ba',YAO:'#d6bd91',XING:'#bac4c1'};
const mountains=[[299,63],[320,60],[341,70],[396,63],[416,83],[284,167],[305,161],[327,171],[155,154],[180,160],[120,337],[143,345]];
const woods=[[123,194],[139,186],[206,224],[296,314],[312,327],[405,357],[422,348],[518,199],[540,210]];
const terrain=`<g class="atlas-terrain" fill="none" stroke="#625d45" stroke-width="1.2" opacity=".32">${mountains.map(([x,y],i)=>`<path d="M${x-11} ${y+7}l11-${17+i%3*3} 13 ${17+i%3*3}m-18-9 5-8 4 8m-12 6 8-7 8 9"/>`).join('')}${woods.map(([x,y])=>`<path d="M${x} ${y+8}v-15m-6 9 6-10 6 10m-14 5 8-11 8 11"/>`).join('')}<path d="M116 381q20-12 40 0m8 12q20-12 40 0m-19-26q20-12 40 0M299 372l16-10m-9 17 16-10m-9 17 16-10M389 320l16-10m-9 17 16-10"/></g>`;

export function map(state,layer,expanded=false){
 const color=c=>layer==='alliance'?({sea:'#9cb9ad',land:'#c7a98b',neutral:'#bdc5bf'}[c.bloc]):atlasPalette[c.id];
 const regions=COUNTRIES.map(c=>`<g class="country-shape" style="--region-fill:${color(c)}" role="button" tabindex="-1" aria-label="查看${c.name}" data-action="country" data-id="${c.id}"><path d="${atlasGeometry[c.id]}" fill="${color(c)}" stroke="#777a62" stroke-width="1.5"/><path d="${atlasGeometry[c.id]}" fill="url(#atlas-grain)" pointer-events="none"/></g>`).join('');
 const labels=COUNTRIES.map(c=>`<g class="map-country-label" role="button" tabindex="0" data-action="country" data-id="${c.id}" data-x="${c.x}" data-y="${c.y}" aria-label="查看${c.name}" transform="translate(${c.x} ${c.y})"><rect class="map-label-hit" x="-22" y="-18" width="44" height="36" rx="5"/><text text-anchor="middle" dominant-baseline="central" class="map-country-name">${c.short}</text></g>`).join('');
 return `<div class="map-panel ${expanded?'expanded-map':''}"><div class="map-heading">${expanded?'<h2>点选国家</h2>':'<button class="map-expand" data-action="map" aria-label="放大地图，方便点选国家">放大地图 <span aria-hidden="true">↗</span></button>'}<div class="segmented" aria-label="地图图层">${[['political','国家'],['alliance','联盟'],['supply','供应']].map(([id,label])=>`<button data-action="layer" data-layer="${id}" class="${layer===id?'selected':''}" aria-pressed="${layer===id}">${label}</button>`).join('')}</div></div>
 <svg class="world-map" viewBox="30 10 620 460" role="group" aria-label="伊澜七国战略地图，点击国家开展外交">
 <defs><pattern id="atlas-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#6a827b" stroke-width=".6" opacity=".16"/></pattern><pattern id="atlas-grain" width="7" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".7" fill="#535747" opacity=".12"/><path d="M5 7h1" stroke="#fff5d1" opacity=".35"/></pattern><filter id="coastal-shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#667c70" flood-opacity=".25"/></filter></defs>
 <rect width="680" height="490" fill="url(#atlas-grid)"/>
 <g fill="none" stroke="#6f8884" opacity=".2" stroke-width="1"><ellipse cx="338" cy="242" rx="303" ry="225"/><ellipse cx="338" cy="242" rx="315" ry="237"/><path d="M20 260Q290 50 660 240M30 400Q320 170 660 380M100 10Q310 240 180 480M500 10Q375 210 610 480"/></g>
 <g fill="none" stroke="#8d9a89" opacity=".25" stroke-width="10" stroke-linejoin="round">${COUNTRIES.map(c=>`<path d="${atlasGeometry[c.id]}"/>`).join('')}</g>
 <g filter="url(#coastal-shadow)">${regions}</g>
 <g pointer-events="none">${terrain}<path d="M178 205Q246 186 332 203T539 246M332 203Q320 274 355 349M160 351Q243 372 355 349" fill="none" stroke="#7a7356" stroke-width="1" stroke-dasharray="2 4" opacity=".45"/>
 <path d="M383 70Q356 105 370 137T362 184Q340 226 361 270T365 353Q375 382 396 404" class="river"/><text x="392" y="300" class="river-label" transform="rotate(70 392 300)">镜河</text>
 <path d="M557 300Q632 345 533 403" fill="none" stroke="#688782" stroke-width="1.2" stroke-dasharray="4 6" opacity=".55"/>
 <text x="567" y="352" class="sea-label" transform="rotate(-14 567 352)">静 海</text><text x="36" y="92" class="map-label">西陆诸邦</text>
 <g transform="translate(598 378)" fill="#657e7c" opacity=".5"><path d="M-10 3H12L6 9H-5Z"/><path d="M0 0V-16L10 0Zm-3 0V-13L-10 0Z"/></g></g>
 ${layer==='supply'?`<g class="routes"><path d="M160 351Q164 218 178 205M160 351Q310 380 355 349M355 349Q456 354 539 246M378 90Q240 82 178 205M522 399Q624 343 539 246"/><circle cx="160" cy="351" r="6"/><circle cx="539" cy="246" r="6"/></g>`:''}
 ${labels}${state.issues.border>0?`<g class="hotspot"><circle cx="350" cy="265" r="27"/><circle cx="350" cy="265" r="19"/><path d="m350 254 11 19h-22Z"/><text x="350" y="270">!</text></g>`:''}
 <g class="compass" transform="translate(610 65)"><circle r="24" opacity=".45"/><circle r="20" opacity=".25"/><path d="M0-29 6-6 29 0 6 6 0 29-6 6-29 0-6-6Z"/><path d="M0-23V23M-23 0H23"/><path d="M0-23 0 0 6-6Z" fill="#8c7550"/><text y="-34">N</text></g>
 <g class="map-scale"><path d="M43 440v6h80v-6m-40 0v6"/><text x="43" y="463">0</text><text x="108" y="463">500 km</text></g><text class="map-label" x="426" y="476">和平委员会测绘局 · 宪章六年</text></svg>
 <div class="map-footer">${layer==='supply'?'<span class="map-hint">虚线标示主要物资依赖，外交可改变供应条件。</span>':'<span><i class="legend-dot sea"></i>环海协作同盟</span><span><i class="legend-dot land"></i>大陆安全协约</span><span><i class="legend-dot neutral"></i>中立国家</span>'}</div></div>`;
}
