// Presentation only. The existing editor owns all writes and save/navigation guards.
export function mountPageFlow(kind) {
  const lab = window[kind === 'ledger' ? 'layoutLab' : 'weeklyLab'];
  const editor = document.querySelector('#editor');
  const nav = document.createElement('nav');
  nav.className = 'page-flow';
  nav.setAttribute('aria-label', kind === 'ledger' ? '受注台帳の表示' : '週間工程の表示');
  editor.before(nav);
  function button(text, id, action) {
    const b = document.createElement('button');
    b.type = 'button'; b.id = id; b.textContent = text;
    b.addEventListener('pointerdown', e => e.preventDefault());
    b.addEventListener('click', async () => {
      const state = lab.getState();
      if (state.saving || state.uncertain || (window.timeincCasePending&&!window.timeincWeeklyReference?.ready)) return;
      const book = lab.api.getActiveWorkbook();
      if (book.isCellEditing() && (!await book.endEditingAsync(true) || book.isCellEditing())) return;
      action();
    });
    nav.append(b);
    return b;
  }
  if (kind === 'weekly') {
    button('今週の実績', 'flow-actual', () => window.timeincWeeklyReference?.ready?window.timeincWeeklyReference.focus('actual'):document.querySelector('#goto-actual').click());
    button('来週の予定', 'flow-plan', () => window.timeincWeeklyReference?.ready?window.timeincWeeklyReference.focus('plan'):document.querySelector('#goto-plan').click());
    const sync = () => nav.querySelectorAll('button').forEach(b => {
      const state=window.weeklyLab.getState();
      b.disabled = state.saving||state.uncertain||(document.querySelector('#save').disabled&&!window.timeincWeeklyReference?.ready);
    });
    new MutationObserver(sync).observe(document.querySelector('#save'), {attributes:true, attributeFilter:['disabled']});
    document.addEventListener('timeinc:weekly-reference',sync);
    sync();
    return;
  }
  const overview = document.createElement('section');
  overview.id = 'ledger-overview'; overview.hidden = true;
  overview.className = 'ledger-overview'; overview.setAttribute('aria-label', '年間一覧');
  editor.after(overview);
  const form=document.createElement('section');
  form.id='ledger-form';form.className='ledger-form';form.setAttribute('aria-label','台帳登録・編集');
  const inputs=new Map();
  for(const [address,label,multiline] of [['A4','工番（先頭）'],['B4','工番（記号）'],['C4','工番（番号）'],['D4','業務名',true],['J4','契約先',true]]){
    const field=document.createElement('label');field.className='ledger-field';
    const title=document.createElement('span');title.textContent=label;
    const input=document.createElement(multiline?'textarea':'input');input.id='ledger-'+address;input.name=address;
    if(multiline)input.rows=address==='D4'?3:2;else input.type='text';
    input.autocomplete='off';input.spellcheck=false;
    const message=document.createElement('small');message.id=input.id+'-error';input.setAttribute('aria-describedby',message.id);
    const stage=composing=>{
      try{
        const valid=lab.stageFormCell(address,input.value,composing);
        input.setAttribute('aria-invalid',String(!valid&&!composing));
        message.textContent=valid||composing?'':address==='A4'?'整数または空欄で入力してください。':'数式・制御文字を含まない文字列（32,767文字以内）を入力してください。';
      }catch(e){input.setAttribute('aria-invalid','true');message.textContent=e.message;}
    };
    input.addEventListener('input',e=>stage(e.isComposing));
    input.addEventListener('compositionend',()=>stage(false));
    field.append(title,input,message);form.append(field);inputs.set(address,input);
  }
  editor.after(form);
  const renderForm=()=>{const values=lab.formValues();for(const [a,input]of inputs)if(document.activeElement!==input)input.value=values[a]??'';};
  const sync=()=>{for(const input of inputs.values())input.disabled=document.querySelector('#save').disabled;};
  new MutationObserver(sync).observe(document.querySelector('#save'),{attributes:true,attributeFilter:['disabled']});sync();
  let mode='form';
  const show = next => {
    if(next!=='form'&&lab.hasFormDrafts()){
      form.querySelector('[aria-invalid=true]')?.focus();return;
    }
    mode=next;
    // Read the same live editor, including unsaved input; never create another record.
    if (next==='annual') {
      const sheet = lab.api.getActiveWorkbook().getActiveSheet();
      const values = ['A4','B4','C4','D4','J4'].map(a => sheet.getRange(a).getValue());
      const table = document.createElement('table');
      const head = table.createTHead().insertRow();
      for (const label of ['工番','業務名','契約先']) {
        const th = document.createElement('th'); th.textContent = label; head.append(th);
      }
      const row = table.createTBody().insertRow();
      for (const value of [values.slice(0,3).map(v => v ?? '').join(' '), values[3], values[4]]) {
        row.insertCell().textContent = value ?? '';
      }
      overview.replaceChildren(table);
    }
    editor.hidden = next!=='sheet'; overview.hidden = next!=='annual';form.hidden=next!=='form';
    edit.setAttribute('aria-pressed',String(next==='form'));
    annual.setAttribute('aria-pressed',String(next==='annual'));
    sheetButton.setAttribute('aria-pressed',String(next==='sheet'));
    if(next==='form')renderForm();
    if(next==='sheet')window.dispatchEvent(new Event('resize'));
  };
  const edit = button('登録・編集', 'flow-edit', () => show('form'));
  const annual = button('年間一覧', 'flow-annual', () => show('annual'));
  const sheetButton=button('Excel表示','flow-sheet',()=>show('sheet'));
  show('form');
  // Saving changes the feedback; refresh an already visible view from that same editor.
  new MutationObserver(() => {if(mode==='annual')show('annual');else if(mode==='form')renderForm();})
    .observe(document.querySelector('#status'), {childList:true, characterData:true, subtree:true});
}
