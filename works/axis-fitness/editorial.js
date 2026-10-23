const programPhotos={strength:['dumbbell','ダンベルでトレーニングする手元のイメージ'],balance:['coaching','指導者が運動の姿勢を確認する様子のイメージ'],habit:['training','マシンを使い体を動かす女性のイメージ']};document.querySelectorAll('[data-program]').forEach(b=>b.addEventListener('click',()=>{const [photo,alt]=programPhotos[b.dataset.program],image=document.querySelector('.program-image img');image.src='assets/'+photo+'.webp';image.alt=alt}));const planLabels=['START / 月2回：¥18,000（税込）','ROUTINE / 月4回：¥34,000（税込）','FOCUS / 月8回：¥64,000（税込）'];document.querySelectorAll('.price-table article').forEach((row,i)=>{const button=document.createElement('button');button.type='button';button.className='plan-choice';button.textContent='このペースを検討する';button.setAttribute('aria-pressed','false');row.querySelector('div').append(button);button.addEventListener('click',()=>{document.querySelectorAll('.price-table article').forEach(r=>{r.classList.toggle('active',r===row);r.querySelector('button').setAttribute('aria-pressed',String(r===row))});document.querySelector('.plan-summary').textContent='選択中：'+planLabels[i]+'。デモ選択のため契約・決済は行われません。'})});const summary=document.createElement('p');summary.className='plan-summary';summary.setAttribute('role','status');summary.textContent='通うペースを選ぶと、月額料金を確認できます。';document.querySelector('.price-table').append(summary);
document.querySelector('.program-tabs').addEventListener('keydown',()=>queueMicrotask(()=>{const selected=document.querySelector('[data-program][aria-selected="true"]');if(selected){const [photo,alt]=programPhotos[selected.dataset.program],image=document.querySelector('.program-image img');image.src='assets/'+photo+'.webp';image.alt=alt}}));

let chosenPlan='';
const planContinue=document.createElement('a');planContinue.href='#trial';planContinue.className='text-link plan-continue';planContinue.textContent='選んだペースで、体験内容を見る ↗';planContinue.hidden=true;summary.after(planContinue);
document.querySelectorAll('.plan-choice').forEach((button,index)=>button.addEventListener('click',()=>{
  chosenPlan=planLabels[index];document.querySelector('#booking-plan').textContent='検討中の通い方：'+chosenPlan+'（架空の月額プラン）';planContinue.hidden=false;
  document.querySelector('#booking-result').textContent='通うペースを変更しました。体験内容を選んで確認してください。';
}));
planContinue.addEventListener('click',event=>{event.preventDefault();document.querySelector('#book').click();});
document.querySelector('.program-copy .text-link').addEventListener('click',event=>{event.preventDefault();document.querySelector('#book').click();});
document.querySelector('form').addEventListener('submit',()=>{
  if(chosenPlan)document.querySelector('#booking-result').textContent+=' 検討中の通い方：'+chosenPlan+'。体験の料金ではありません。';
});
document.querySelector('form').addEventListener('input',()=>document.querySelector('#booking-result').textContent='選択を変更しました。「選択内容を確認」で最新の内容を確かめてください。');
