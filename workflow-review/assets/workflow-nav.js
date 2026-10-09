// Navigation never writes a workbook. Existing save + readback is the only save path.
const nav=document.querySelector('[data-workflow-nav]');
const status=document.querySelector('#status');
let destinations=null, busy=false;
const lab=()=>window.layoutLab||window.weeklyLab||window.xlsxLab||window.ledgerLab;
const state=()=>lab()?.getState();
const editing=()=>!!lab()?.api.getActiveWorkbook().isCellEditing();
const tell=text=>{if(status)status.textContent=text;};
const dialog=document.createElement('dialog');
dialog.id='workflow-confirm';
dialog.innerHTML='<h2>入力を保存して移動しますか？</h2><p>未保存の入力があります。</p><div><button data-choice="stay">この画面に残る</button><button data-choice="discard">破棄して移動</button><button data-choice="save">保存して移動</button></div>';
document.body.append(dialog);
function choose(){return new Promise(resolve=>{
  const click=e=>{const button=e.target.closest('[data-choice]');if(!button)return;finish(button.dataset.choice);};
  const cancel=e=>{e.preventDefault();finish('stay');};
  function finish(choice){dialog.removeEventListener('click',click);dialog.removeEventListener('cancel',cancel);dialog.close();resolve(choice);}
  dialog.addEventListener('click',click);dialog.addEventListener('cancel',cancel);dialog.showModal();
});}
async function move(key){
  if(busy||!destinations||!Object.hasOwn(destinations,key))return;
  const current=state();
  if(!destinations||!current)return tell('画面の準備ができるまでお待ちください');
  if(current.saving)return tell('保存中です。確認が終わるまでこの画面に残ってください');
  if(current.uncertain)return tell('保存結果が未確定です。「保存版の確認」で確認してから移動してください');
  busy=true;
  try{
    if(current.dirty||current.draftActive||editing()){
      const choice=await choose();
      if(choice==='stay')return;
      if(choice==='save'){
        await lab().saveWorkbook();
        // The editor owns commit, failure, conflict and full-file readback.
        const s=state();
        if(s.saving||s.uncertain||s.dirty||s.draftActive||editing())return tell('保存確認が終わっていないため移動しません');
      }
    }
    window.timeincNavigationApproved=true;
    location.assign(destinations[key]);
  }finally{busy=false;}
}
if(nav){
  nav.addEventListener('pointerdown',e=>{if(e.target.closest('[data-go]'))e.preventDefault();});
  nav.addEventListener('click',e=>{const button=e.target.closest('[data-go]');if(button&&!button.disabled&&button.getAttribute('aria-disabled')!=='true')move(button.dataset.go).catch(()=>tell('移動できません。入力を保持したままこの画面に残ります'));});
  destinations={home:new URL("../",location.href).href,ledger:new URL("../ledger/",location.href).href,weekly:new URL("../weekly/",location.href).href,month:new URL("../?view=month",location.href).href,cost:new URL("../?view=cost",location.href).href,billing:new URL("../?view=billing",location.href).href,classification:new URL("../?view=classification",location.href).href,print:new URL("../?view=print",location.href).href,meeting:new URL("../?view=meeting",location.href).href,notifications:new URL("../?view=notifications",location.href).href,files:new URL("../?view=files",location.href).href,search:new URL("../?view=search",location.href).href,schedule:new URL("../?view=schedule",location.href).href,attendance:new URL("../?view=attendance",location.href).href};
}
window.addEventListener('pageshow',async e=>{
  window.timeincNavigationApproved=false;
  if(!e.persisted)return;
  // BFCache keeps old JS state. Do not silently call it the latest saved version.
  tell('戻った画面です。保存版を確認しています…');
  const button=document.querySelector('#readback');
  if(button&&!button.disabled)button.click();
  else tell('戻った画面の保存状態は未確認です。保存版を確認してください');
});
