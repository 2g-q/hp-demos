const f=document.querySelector('iframe');
const mobile=matchMedia('(max-width:760px)');
let ro,dialogObserver;
// A dialog lives in the iframe viewport. Keep it within the part of that
// viewport currently visible in the parent, without moving either page.
function placeDialogs(){
  const d=f.contentDocument;if(!d)return;
  const rect=f.getBoundingClientRect();
  const top=Math.max(0,-rect.top);
  const bottom=Math.min(f.clientHeight,window.innerHeight-rect.top);
  const visible=Math.max(0,bottom-top);
  const inset=Math.min(16,visible/4);
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
  f.contentDocument.documentElement.style.setProperty('--demo-screen-height',(mobile.matches?window.innerHeight:f.clientHeight)+'px');
  if(mobile.matches){
    const d=f.contentDocument;
    const h=Math.max(d.body.scrollHeight,d.body.offsetHeight);
    if(Math.abs(parseFloat(f.style.height||0)-h)>2)f.style.height=h+'px';
  }else f.style.height='';
  placeDialogs();
}
f.addEventListener('load',()=>{
  if(ro)ro.disconnect();if(dialogObserver)dialogObserver.disconnect();
  const d=f.contentDocument;
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
