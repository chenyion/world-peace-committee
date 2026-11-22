// Counteract SVG scaling so country names remain readable on short phones.
function fitMapLabels(svg){
 const box=svg.getBoundingClientRect();
 const scale=Math.min(box.width/svg.viewBox.baseVal.width,box.height/svg.viewBox.baseVal.height);
 if(!scale)return;
 const expanded=svg.closest('.expanded-map')!==null,small=!expanded&&scale<.36;
 svg.classList.toggle('compact-labels',small);
 for(const label of svg.querySelectorAll('.map-country-label')){
  label.setAttribute('transform',`translate(${label.dataset.x} ${label.dataset.y}) scale(${1/scale})`);
  const hit=label.querySelector('rect'),w=small?34:44,h=expanded?44:small?24:34;
  for(const [key,value] of Object.entries({x:-w/2,y:-h/2,width:w,height:h}))hit.setAttribute(key,value);
 }
}
const mapResizeObserver=new ResizeObserver(entries=>entries.forEach(({target})=>fitMapLabels(target)));
export function observeMaps(){
 mapResizeObserver.disconnect();
 document.querySelectorAll('.world-map').forEach(svg=>{fitMapLabels(svg);mapResizeObserver.observe(svg);});
}
