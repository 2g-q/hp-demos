const programPhotos={strength:['dumbbell','ダンベルでトレーニングする手元のイメージ'],balance:['coaching','指導者が運動の姿勢を確認する様子のイメージ'],habit:['training','マシンを使い体を動かす女性のイメージ']};
function updateProgramPhoto(){
  const selected=document.querySelector('[data-program][aria-selected="true"]');
  const [photo,alt]=programPhotos[selected.dataset.program],image=document.querySelector('.program-image img');
  image.src='assets/'+photo+'.webp';image.alt=alt;
}
document.querySelectorAll('[data-program]').forEach(button=>button.addEventListener('click',updateProgramPhoto));
document.querySelector('.program-tabs').addEventListener('keydown',()=>queueMicrotask(updateProgramPhoto));
document.querySelector('#booking-program').addEventListener('change',event=>{activate(tabs.find(tab=>tab.dataset.program===event.target.value));updateProgramPhoto();});

const planLabels=['START / 月2回：¥18,000（税込）','ROUTINE / 月4回：¥34,000（税込）','FOCUS / 月8回：¥64,000（税込）'];
let chosenPlan='';
const summary=document.createElement('p');summary.className='plan-summary';summary.setAttribute('role','status');summary.textContent='通うペースを選ぶと、月額料金を確認できます。';document.querySelector('.price-table').append(summary);
const planContinue=document.createElement('a');planContinue.href='#trial';planContinue.className='text-link plan-continue';planContinue.textContent='選んだペースで、体験内容を見る ↗';planContinue.hidden=true;summary.after(planContinue);
const clearPlan=document.createElement('button');clearPlan.type='button';clearPlan.className='plan-reset';clearPlan.textContent='月額プランは後で考える';clearPlan.hidden=true;planContinue.after(clearPlan);
document.querySelectorAll('.price-table article').forEach((row,index)=>{
  const button=document.createElement('button');button.type='button';button.className='plan-choice';button.textContent='このペースを検討する';button.setAttribute('aria-pressed','false');row.querySelector('div').append(button);
  button.addEventListener('click',()=>{
    chosenPlan=planLabels[index];
    document.querySelectorAll('.price-table article').forEach(item=>{item.classList.toggle('active',item===row);item.querySelector('button').setAttribute('aria-pressed',String(item===row));});
    summary.textContent='選択中：'+chosenPlan+'。デモ選択のため契約・決済は行われません。';
    document.querySelector('#booking-plan').textContent='検討中の通い方：'+chosenPlan+'（架空の月額プラン）';
    planContinue.hidden=false;clearPlan.hidden=false;
    document.querySelector('#booking-result').textContent='通うペースを変更しました。体験内容を選んで確認してください。';
  });
});
clearPlan.addEventListener('click',()=>{
  chosenPlan='';document.querySelectorAll('.price-table article').forEach(row=>{row.classList.remove('active');row.querySelector('button').setAttribute('aria-pressed','false');});
  summary.textContent='月額プランは未選択です。体験内容だけでも確認できます。';
  document.querySelector('#booking-plan').textContent='通うペース：まだ選んでいません。体験内容だけでも確認できます。';
  document.querySelector('#booking-result').textContent='通うペースを変更しました。体験内容を選んで確認してください。';
  planContinue.hidden=true;clearPlan.hidden=true;document.querySelector('.plan-choice').focus();
});
planContinue.addEventListener('click',event=>{event.preventDefault();dialog.showModal();});
document.querySelector('.program-copy .text-link').addEventListener('click',event=>{event.preventDefault();dialog.showModal();});
document.querySelector('form').addEventListener('submit',event=>{
  event.preventDefault();
  const result=document.querySelector('#booking-result'),program=document.querySelector('#booking-program');
  result.innerHTML='<h3>体験前に整理したこと</h3><dl class="trial-review"><div><dt>プログラム</dt><dd id="review-program"></dd></div><div><dt>希望の時間帯</dt><dd id="review-slot"></dd></div><div><dt>検討中の通い方</dt><dd id="review-plan"></dd></div></dl><p class="review-note">月額プランは体験の料金ではありません。日付・空席・体験料金は未設定で、実際の予約・外部送信は行われていません。</p><button type="button" class="review-edit">体験内容を選び直す</button>';
  document.querySelector('#review-program').textContent=program.options[program.selectedIndex].text;
  document.querySelector('#review-slot').textContent=document.querySelector('[name="slot"]:checked').value;
  document.querySelector('#review-plan').textContent=chosenPlan||'体験後に考えたい / 月額プラン未選択';
  result.querySelector('.review-edit').addEventListener('click',()=>{result.textContent='選択を変更できます。確認ボタンでもう一度、内容を確かめてください。';program.focus();});
  const finish=document.createElement('button');finish.type='button';finish.className='review-finish';finish.textContent='確認を終える';finish.addEventListener('click',()=>dialog.close());result.append(finish);
  result.focus({preventScroll:true});result.scrollIntoView({block:'nearest'});
});
document.querySelector('form').addEventListener('input',()=>document.querySelector('#booking-result').textContent='選択を変更しました。「選択内容を確認」で最新の内容を確かめてください。');
