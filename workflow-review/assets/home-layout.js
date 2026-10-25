// Home appearance only: no case, weekly or employee records are read or written.
const IDS=['weekly','apps','board','where'];
const LABELS={weekly:'週間工程表',apps:'業務への入口',board:'掲示板',where:'行先'};
const standard=()=>({version:1,order:[...IDS],hidden:[]});
function validate(value){
 if(!value||Object.keys(value).sort().join()!=='hidden,order,version'||value.version!==1||!Array.isArray(value.order)||value.order.length!==IDS.length||new Set(value.order).size!==IDS.length||value.order.some(id=>!IDS.includes(id))||!Array.isArray(value.hidden)||new Set(value.hidden).size!==value.hidden.length||value.hidden.some(id=>!IDS.includes(id))||value.hidden.length===IDS.length)throw Error('ホームの配置を確認できません。');
 return value;
}
const element=(tag,text,cls)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;};
const button=(text,action)=>{const el=element('button',text);el.type='button';el.addEventListener('click',action);return el;};
export function mountHomeLayout(dashboard){
 const top=dashboard.querySelector('.dash-top'),bottom=dashboard.querySelector('.dash-bottom');
 const sections=[...top.children,...bottom.children],widgets=new Map(IDS.map((id,i)=>[id,sections[i]]));
 const grid=element('div',null,'dash-widgets');top.before(grid);top.remove();bottom.remove();
 const base=new URL('./',location.href).pathname,key=`workflow-review:v1:${base}:home-layout`;
 const status=element('p',null,'home-layout-status');status.id='home-layout-status';status.setAttribute('role','status');dashboard.querySelector('.dash-heading').after(status);
 let confirmed=standard(),draft,editing=false,unconfirmed=false,pending=null,drag=null;
 const originals=new Map(),checks=new Map(),controls=new Map(),animations=new Map();
 for(const [id,section]of widgets){
  section.dataset.homeWidget=id;section.setAttribute('aria-label',LABELS[id]);
  originals.set(section,{tabindex:section.getAttribute('tabindex'),draggable:section.getAttribute('draggable')});
  for(const link of section.querySelectorAll('a'))originals.set(link,{tabindex:link.getAttribute('tabindex'),draggable:link.getAttribute('draggable')});
 }
 const stopAnimations=()=>{for(const animation of animations.values())animation.cancel();animations.clear();};
 function arrange(value,dom=true,animate=false){
  stopAnimations();const before=new Map([...widgets].map(([id,section])=>[id,section.getBoundingClientRect()]));
  value.order.forEach((id,index)=>{const section=widgets.get(id);section.hidden=value.hidden.includes(id);section.style.order=String(index);if(dom)grid.append(section);});
  if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)for(const [id,section]of widgets){
   if(section.hidden||id===drag?.id)continue;const prior=before.get(id),next=section.getBoundingClientRect(),x=prior.left-next.left,y=prior.top-next.top;
   if(x||y)animations.set(id,section.animate([{transform:`translate(${x}px,${y}px)`},{transform:'translate(0,0)'}],{duration:140,easing:'ease-out'}));
  }
 }
 try{const raw=localStorage.getItem(key);if(raw!==null)confirmed=validate(JSON.parse(raw));}catch{status.textContent='ホームの配置を読み込めなかったため、標準配置で表示しています。';}
 arrange(confirmed);
 const toolbar=element('section',null,'home-canvas-toolbar');toolbar.id='home-canvas-toolbar';toolbar.hidden=true;toolbar.setAttribute('aria-label','ホームの配置を編集');
 const instruction=element('p','カードをドラッグして配置を変更');
 const actions=element('div',null,'home-canvas-actions'),visibility=element('details',null,'home-canvas-visibility'),summary=element('summary','表示するカード');visibility.append(summary);
 for(const id of IDS){const label=element('label'),check=element('input');check.type='checkbox';check.dataset.widget=id;check.addEventListener('change',()=>{if(drag)return;draft.hidden=check.checked?draft.hidden.filter(x=>x!==id):[...draft.hidden,id];arrange(draft);update();});label.append(check,element('span',LABELS[id]));visibility.append(label);checks.set(id,check);}
 const done=button('完了',()=>{
  if(drag)return;
  try{validate(draft);}catch{status.textContent='1つ以上のカードを表示してください。';return;}
  const raw=JSON.stringify(draft);
  try{localStorage.setItem(key,raw);}catch{status.textContent='配置を保存できません。変更内容は残っています。再度「完了」を押してください。';return;}
  try{if(localStorage.getItem(key)!==raw)throw Error();}catch{unconfirmed=true;pending=structuredClone(draft);cancel.textContent='閉じる';status.textContent='配置の保存結果を確認できません。変更内容は残っています。再度「完了」で確認してください。';return;}
  confirmed=structuredClone(draft);unconfirmed=false;pending=null;status.textContent='';finish();
 });done.id='home-canvas-done';done.className='home-canvas-primary';
 const cancel=button('キャンセル',()=>{if(drag)endDrag(false);finish();status.textContent=unconfirmed?'配置の保存結果は未確認です。「ホームを編集」から再度「完了」で確認してください。':'';});cancel.id='home-canvas-cancel';
 const reset=button('標準に戻す',()=>{if(drag)return;draft=standard();arrange(draft,true,true);update();});reset.id='home-canvas-reset';actions.append(visibility,reset,cancel,done);toolbar.append(instruction,actions);grid.before(toolbar);
 function update(){
  for(const id of IDS){checks.get(id).checked=!draft.hidden.includes(id);checks.get(id).disabled=!!drag;const index=draft.order.indexOf(id),pair=controls.get(id);if(pair){pair.up.disabled=index===0;pair.down.disabled=index===IDS.length-1;}}
  done.disabled=draft.hidden.length===IDS.length||!!drag;reset.disabled=!!drag;
  if(draft.hidden.length===IDS.length)status.textContent='1つ以上のカードを表示してください。';
  else if(status.textContent==='1つ以上のカードを表示してください。')status.textContent='';
 }
 function finish(){
  stopAnimations();editing=false;toolbar.hidden=true;visibility.open=false;grid.classList.remove('home-canvas-editing');grid.removeAttribute('aria-label');
  for(const node of originals.keys())for(const [name,value]of Object.entries(originals.get(node))){if(value===null)node.removeAttribute(name);else node.setAttribute(name,value);}
  for(const pair of controls.values())pair.root.remove();controls.clear();arrange(confirmed);trigger.hidden=false;trigger.focus({preventScroll:true});
 }
 function begin(){
  editing=true;draft=structuredClone(unconfirmed?pending:confirmed);cancel.textContent=unconfirmed?'閉じる':'キャンセル';status.textContent=unconfirmed?'前回の保存結果は未確認です。再度「完了」で確認してください。':'';
  trigger.hidden=true;toolbar.hidden=false;grid.classList.add('home-canvas-editing');grid.setAttribute('aria-label','カードを並べ替え');
  for(const [id,section]of widgets){
   section.draggable=true;section.tabIndex=0;
   for(const link of section.querySelectorAll('a')){link.draggable=false;link.tabIndex=-1;}
   const root=element('div',null,'home-canvas-card-controls');
   const move=offset=>{if(drag)return;const index=draft.order.indexOf(id),target=index+offset;if(target<0||target>=IDS.length)return;[draft.order[index],draft.order[target]]=[draft.order[target],draft.order[index]];arrange(draft,true,true);update();section.focus({preventScroll:true});};
   const up=button('↑',()=>move(-1)),down=button('↓',()=>move(1));up.setAttribute('aria-label',LABELS[id]+'を上へ');down.setAttribute('aria-label',LABELS[id]+'を下へ');root.append(up,down);section.append(root);controls.set(id,{root,up,down});
  }
  arrange(draft);update();visibility.open=false;widgets.get(draft.order.find(id=>!draft.hidden.includes(id))).focus({preventScroll:true});
 }
 const dropSurface=element('div',null,'home-canvas-drop-surface');dropSurface.hidden=true;dropSurface.setAttribute('aria-hidden','true');grid.append(dropSurface);
 const dragType='application/x-timeinc-home-card';let pointerCanDrag=false;
 grid.addEventListener('pointerdown',event=>{pointerCanDrag=editing&&event.button===0&&!event.target.closest('.home-canvas-card-controls');});
 const accepts=event=>editing&&drag&&Array.from(event.dataTransfer?.types||[]).includes(dragType);
 function endDrag(accept){
  if(!drag)return;const current=drag;drag=null;if(!accept)draft.order=current.order;
  dropSurface.hidden=true;grid.classList.remove('home-canvas-drag-active');for(const section of widgets.values())section.classList.remove('home-canvas-picked');arrange(draft);update();
 }
 for(const [id,section]of widgets){
  section.addEventListener('dragstart',event=>{
   if(!editing)return;
   if(!pointerCanDrag||event.target.closest('.home-canvas-card-controls')){event.preventDefault();return;}
   stopAnimations();const visible=draft.order.filter(item=>!draft.hidden.includes(item));
   drag={id,order:[...draft.order],slots:visible.map(item=>{const r=widgets.get(item).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,width:r.width,height:r.height};}),current:visible.indexOf(id),bounds:grid.getBoundingClientRect()};
   event.dataTransfer.effectAllowed='move';event.dataTransfer.setData(dragType,id);section.classList.add('home-canvas-picked');grid.classList.add('home-canvas-drag-active');update();
  });
  section.addEventListener('dragend',()=>endDrag(false));
 }
 grid.addEventListener('dragover',event=>{
  if(!editing)return;event.preventDefault();
  if(!accepts(event)){if(event.dataTransfer)event.dataTransfer.dropEffect='none';return;}dropSurface.hidden=false;event.dataTransfer.dropEffect='move';
  const {left,right,top,bottom}=drag.bounds;if(event.clientX<left||event.clientX>right||event.clientY<top||event.clientY>bottom)return;
  const distances=drag.slots.map(slot=>((event.clientX-slot.x)/slot.width)**2+((event.clientY-slot.y)/slot.height)**2),best=distances.indexOf(Math.min(...distances));
  if(best===drag.current||distances[drag.current]-distances[best]<.12)return;
  const target=draft.order.filter(id=>!draft.hidden.includes(id))[best],order=draft.order.filter(id=>id!==drag.id);order.splice(order.indexOf(target)+(best>drag.current?1:0),0,drag.id);draft.order=order;drag.current=best;arrange(draft,false,true);
 });
 grid.addEventListener('drop',event=>{if(!editing)return;event.preventDefault();endDrag(!!(accepts(event)&&event.dataTransfer.getData(dragType)===drag.id));});
 for(const name of ['click','auxclick'])grid.addEventListener(name,event=>{if(editing&&!event.target.closest('.home-canvas-card-controls')){event.preventDefault();event.stopImmediatePropagation();}},true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&editing){if(drag)endDrag(false);else cancel.click();}});
 const trigger=button('ホームを編集',begin);trigger.id='home-layout-edit';
 const headingActions=element('div',null,'dash-heading-actions'),search=dashboard.querySelector('.dash-search');headingActions.append(trigger,search);dashboard.querySelector('.dash-heading').append(headingActions);
}
