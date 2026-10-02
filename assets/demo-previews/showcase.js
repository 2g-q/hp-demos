const f=document.querySelector('iframe');
const mobile=matchMedia('(max-width:760px)');
let ro,dialogObserver;
let overlayMenus=[];
// A dialog lives in the iframe viewport. Keep it within the part of that
// viewport currently visible in the parent, without moving either page.
function placeDialogs(){
  const d=f.contentDocument;if(!d)return;
  const rect=f.getBoundingClientRect();
  const top=Math.max(0,-rect.top);
  const bottom=Math.min(f.clientHeight,window.innerHeight-rect.top);
  const visible=Math.max(0,bottom-top);
  const inset=Math.min(16,visible/4);
  // An expanded mobile iframe is as tall as the whole sample. Its fixed
  // navigation must use the visible parent viewport, not that document height.
  overlayMenus.forEach(({menu,offset})=>{
    menu.style.setProperty('--demo-overlay-top',(top+offset)+'px');
    menu.style.setProperty('--demo-overlay-height',Math.max(0,visible-offset)+'px');
  });
  d.querySelectorAll('dialog').forEach(dialog=>{
    Object.assign(dialog.style,{
      position:'fixed',top:(top+inset)+'px',bottom:'auto',left:'0',right:'0',
      margin:'0 auto',boxSizing:'border-box',
      maxHeight:Math.max(0,visible-inset*2)+'px',overflow:'auto'
    });
  });
}
function resize(){
  if(!f.contentDocument)return;
  f.contentDocument.documentElement.toggleAttribute('data-demo-expanded',mobile.matches);
  f.contentDocument.documentElement.style.setProperty('--demo-screen-height',(mobile.matches?window.innerHeight:f.clientHeight)+'px');
  if(mobile.matches){
    const d=f.contentDocument;
    d.querySelectorAll('nav.menu,nav.gnav,nav.mnav').forEach(menu=>{
      if(overlayMenus.some(item=>item.menu===menu))return;
      const style=f.contentWindow.getComputedStyle(menu);
      if(style.position!=='fixed')return;
      const headerBottom=d.querySelector('header')?.getBoundingClientRect().bottom||0;
      overlayMenus.push({menu,offset:Math.max(0,parseFloat(style.top)||0,headerBottom)});
      menu.setAttribute('data-demo-overlay','');
    });
    const h=Math.max(d.body.scrollHeight,d.body.offsetHeight);
    if(Math.abs(parseFloat(f.style.height||0)-h)>2)f.style.height=h+'px';
  }else f.style.height='';
  placeDialogs();
}
f.addEventListener('load',()=>{
  if(ro)ro.disconnect();if(dialogObserver)dialogObserver.disconnect();
  const d=f.contentDocument;
  const catalogue=new URL('./cw-web.html',location.href);
  d.querySelectorAll('a[href]').forEach(link=>{
    const url=new URL(link.href,d.baseURI);
    if(url.origin===catalogue.origin&&url.pathname===catalogue.pathname)link.target='_top';
  });
  overlayMenus=[];
  const overlayStyle=d.createElement('style');
  overlayStyle.textContent='[data-demo-expanded] [data-demo-overlay]{top:var(--demo-overlay-top)!important;bottom:auto!important;height:var(--demo-overlay-height)!important;max-height:var(--demo-overlay-height)!important;overflow-y:auto;justify-content:safe center!important;align-items:safe center!important}';
  d.head.appendChild(overlayStyle);
  // Capture runs before the sample's click listener calls showModal().
  d.addEventListener('click',placeDialogs,true);
  dialogObserver=new MutationObserver(placeDialogs);
  dialogObserver.observe(d.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
  resize();ro=new ResizeObserver(resize);ro.observe(d.body);
  d.fonts.ready.then(resize);
});
mobile.addEventListener('change',resize);
window.addEventListener('resize',resize);
window.addEventListener('scroll',placeDialogs,{passive:true});
