const menu=document.querySelector('.menu'),nav=document.querySelector('nav');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.focus()}});const dialog=document.querySelector('dialog');document.querySelector('#open-visit').addEventListener('click',()=>dialog.showModal());document.querySelector('.close').addEventListener('click',()=>dialog.close());
document.querySelectorAll('.jobs-list details').forEach((item,index)=>item.querySelector('a').addEventListener('click',()=>{document.querySelector('#role').value=index===0?'木工製作':'設計・製作図';document.querySelector('#visit-result').textContent='選択を変更しました。「見学メモを確認する」で内容を確認してください。外部送信は行いません。'}));

const rolePreview=document.createElement('p');rolePreview.className='selection-note';rolePreview.setAttribute('role','status');rolePreview.textContent='見学したい仕事は、確認画面で選べます。';document.querySelector('#entry .entry-row').after(rolePreview);
document.querySelectorAll('.jobs-list details').forEach(item=>item.querySelector('a').addEventListener('click',()=>{rolePreview.textContent='選んだ仕事：'+document.querySelector('#role').value+'。「見学の流れを体験する」から、確かめたいことを選べます。';}));
document.querySelector('form').addEventListener('submit',event=>{
  event.preventDefault();
  const topics=[...document.querySelectorAll('[name="visit-topic"]:checked')].map(input=>input.value);
  const result=document.querySelector('#visit-result');
  result.innerHTML='<h3>工房で聞いてみたいこと</h3><dl class="visit-review"><div><dt>見てみたい仕事</dt><dd id="review-role"></dd></div><div><dt>希望の時間帯</dt><dd id="review-timing"></dd></div><div><dt>見学のテーマ</dt><dd id="review-topics"></dd></div></dl><p id="review-conditions"></p><p class="review-note">日付・空き枠は未設定です。見学メモの確認までを体験できるデモで、予約・外部送信は行われません。</p><button type="button" class="review-edit">見学メモを選び直す</button>';
  document.querySelector('#review-role').textContent=document.querySelector('#role').value;
  document.querySelector('#review-timing').textContent=document.querySelector('#timing').value;
  document.querySelector('#review-topics').textContent=topics.length?topics.join('、'):'まずは工房を見てから考えたい';
  const conditions=document.querySelector('#review-conditions');
  conditions.hidden=document.querySelector('#role').value!=='設計・製作図';
  conditions.textContent=conditions.hidden?'':'設計・製作図の給与・勤務条件は未設定のため、確認事項に含めています。';
  result.querySelector('.review-edit').addEventListener('click',()=>{result.textContent='選択を変更できます。確認ボタンでもう一度、内容を確かめてください。';document.querySelector('#role').focus();});
  const finish=document.createElement('button');finish.type='button';finish.className='review-finish';finish.textContent='確認を終える';finish.addEventListener('click',()=>dialog.close());result.append(finish);
  result.focus({preventScroll:true});result.scrollIntoView({block:'nearest'});
});
document.querySelector('form').addEventListener('input',()=>document.querySelector('#visit-result').textContent='選択を変更しました。「見学メモを確認する」で内容を確認してください。外部送信は行いません。');
document.querySelector('#role').addEventListener('change',()=>{rolePreview.textContent='選んだ仕事：'+document.querySelector('#role').value+'。「見学の流れを体験する」から、確かめたいことを選べます。';});
document.querySelectorAll('.jobs-list details a').forEach(link=>link.addEventListener('click',()=>document.querySelector('#open-visit').focus({preventScroll:true})));
