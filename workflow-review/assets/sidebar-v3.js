// v3 shell only. Actual editor page navigation stays in unchanged workflow-nav.js.
const page=document.body.dataset.workflowPage;
if(['home','ledger','weekly'].includes(page)){
 const icon=path=>'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="'+path+'"/></svg>';
 const mount=document.createElement('div');mount.className='v3-sidebar';
 mount.innerHTML='<div class="v3-rail" aria-label="主メニュー"><button id="sidebar-home" data-category="home" aria-label="ホームの一覧" title="ホーム" aria-pressed="false">'+icon('M3 11l9-8 9 8 M5 9v12h14V9 M9 21v-7h6v7')+'</button><button id="sidebar-excel" data-category="excel" aria-label="Excel業務の一覧" title="Excel業務" aria-pressed="false">'+icon('M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h8 M11 11v7')+'</button><button id="sidebar-settings" aria-label="設定" title="設定" aria-haspopup="dialog">'+icon('M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0')+'</button></div><nav id="sidebar-pages" class="v3-panel" aria-label="画面一覧" '+(page==='home'?'':'data-workflow-nav')+'><div id="sidebar-heading" class="v3-panel-title">Excel業務</div><div class="v3-page-list" data-category-pages="home"><button data-go="home">案件一覧</button></div><div class="v3-page-list" data-category-pages="excel"><button data-go="ledger">受注台帳</button><button data-go="weekly">週間工程表</button></div><small class="v3-sidebar-scope">匿名試作 · 名称対応は仮</small></nav>';
 document.body.prepend(mount);
 const wordmark=document.querySelector('header img[alt="timeInc."]');
 const brand=mount.querySelector('.v3-sidebar-scope');
 brand.className='v3-sidebar-brand';brand.textContent='';
 if(wordmark)brand.append(wordmark);
 const panel=document.querySelector('#sidebar-pages');
 const current=panel.querySelector('[data-go="'+page+'"]');current.setAttribute('aria-current','page');current.disabled=true;
 function category(next){for(const button of mount.querySelectorAll('[data-category]'))button.setAttribute('aria-pressed',String(button.dataset.category===next));for(const group of panel.querySelectorAll('[data-category-pages]'))group.hidden=group.dataset.categoryPages!==next;document.querySelector('#sidebar-heading').textContent=next==='home'?'ホーム':'Excel業務';}
 category(page==='home'?'home':'excel');
 for(const button of mount.querySelectorAll('[data-category]')){button.addEventListener('pointerdown',e=>e.preventDefault());button.addEventListener('click',()=>category(button.dataset.category));}

 const settings=document.createElement('dialog');settings.id='v3-settings';settings.setAttribute('aria-labelledby','v3-settings-title');
 settings.innerHTML='<header><h2 id="v3-settings-title">設定</h2><button id="v3-settings-close" aria-label="設定を閉じる">閉じる</button></header><fieldset><legend>外観</legend><label><input type="radio" name="v3-appearance" value="light">ライト</label><label><input type="radio" name="v3-appearance" value="dark">ダーク</label></fieldset><p id="v3-preference-status">この画面の外観を、このブラウザに保存します。</p>';
 document.body.append(settings);
 const theme=document.querySelector('#theme');theme.hidden=true;settings.append(theme); // Keep existing theme handler and its node.
 const themeClass=page==='home'?'dark':'shell-dark',key='workflow-review:v1:appearance';
 const appearance=()=>document.body.classList.contains(themeClass)?'dark':'light';
 const reflect=()=>{for(const radio of settings.querySelectorAll('[name=v3-appearance]'))radio.checked=radio.value===appearance();theme.textContent=appearance()==='dark'?'ライト':'ダーク';};
 const remember=()=>{try{localStorage.setItem(key,appearance());document.querySelector('#v3-preference-status').textContent='この画面の外観を、このブラウザに保存します。';}catch{document.querySelector('#v3-preference-status').textContent='外観は反映しましたが、このブラウザでは保存できません。';}};
 try{document.body.classList.toggle(themeClass,localStorage.getItem(key)==='dark');}catch{/* Storage unavailable; never touch workbook state. */}
 reflect();
 for(const radio of settings.querySelectorAll('[name=v3-appearance]'))radio.addEventListener('change',()=>{if(!radio.checked)return;if(appearance()!==radio.value)theme.click();document.body.classList.toggle(themeClass,radio.value==='dark');reflect();remember();});
 let lastAppearance=appearance();new MutationObserver(()=>{const next=appearance();if(next!==lastAppearance){lastAppearance=next;reflect();remember();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
 const settingsButton=document.querySelector('#sidebar-settings');settingsButton.addEventListener('pointerdown',e=>e.preventDefault());
 settingsButton.addEventListener('click',async()=>{
  const lab=window.layoutLab||window.weeklyLab,book=lab?.api.getActiveWorkbook();
  if(book?.isCellEditing()&&(!await book.endEditingAsync(true)||book.isCellEditing())){const status=document.querySelector('#status');if(status)status.textContent='入力を確定できません。入力を保持したまま確認してください';return;}
  reflect();if(!settings.open)settings.showModal();
 });
 document.querySelector('#v3-settings-close').addEventListener('click',()=>settings.close());settings.addEventListener('close',()=>settingsButton.focus());

 const actions=document.querySelector('#additional-actions'),saveStatus=document.querySelector('#status');
 if(actions&&saveStatus){
  const revealRecovery=()=>{
   if(!(window.layoutLab||window.weeklyLab)?.getState().uncertain)return;
   actions.open=true;
   if(/^(?:TypeError:\s*)?(?:Failed to fetch|NetworkError when attempting to fetch resource\.?|Load failed)$/i.test(saveStatus.textContent.trim()))saveStatus.textContent='保存結果を確認できません。「保存版の確認」を押してください。';
  };
  new MutationObserver(revealRecovery).observe(saveStatus,{childList:true,characterData:true,subtree:true});
  revealRecovery();
 }

 if(page==='home'){
  const destinations={home:new URL('./',location.href).href,ledger:new URL('./ledger/',location.href).href,weekly:new URL('./weekly/',location.href).href};
  panel.addEventListener('click',e=>{const button=e.target.closest('[data-go]');if(!button||button.disabled)return;if(destinations)location.assign(destinations[button.dataset.go]);else document.querySelector('#home-status').textContent='画面切替を準備中です。少し待ってからお試しください';});
 }
}
