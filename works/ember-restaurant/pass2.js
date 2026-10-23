const chefPhoto=document.createElement('img');chefPhoto.className='chef-detail';chefPhoto.src='assets/kitchen.jpg';chefPhoto.alt='料理を仕上げる手元の参考写真';chefPhoto.width=1233;chefPhoto.height=1800;document.querySelector('.hero-aside .sun').replaceWith(chefPhoto);
function updateDinner(){const selected=[...document.querySelectorAll('[data-dish]:checked')];const receipt=document.querySelector('#receipt-items');receipt.replaceChildren(...selected.map(item=>{const row=document.createElement('div');row.className='receipt-row';const name=document.createElement('span');name.textContent=item.dataset.dish;const price=document.createElement('span');price.textContent='¥'+Number(item.value).toLocaleString('ja-JP');row.append(name,price);return row;}));if(!selected.length){const note=document.createElement('p');note.textContent='食べたい料理を選んでください';note.style.fontSize='10px';receipt.append(note);}document.querySelector('#receipt-total').textContent='¥'+selected.reduce((total,item)=>total+Number(item.value),0).toLocaleString('ja-JP');}document.querySelectorAll('[data-dish]').forEach(input=>input.addEventListener('change',updateDinner));updateDinner();
document.querySelector('.dinner-receipt>a').addEventListener('click',()=>{document.querySelector('#visit-time').value='ディナー';document.querySelector('#party-size').value='2名';});document.querySelector('#booking-form').addEventListener('submit',()=>{
  const result=document.querySelector('#booking-result');
  result.textContent+=' 席の希望：'+document.querySelector('#seat').value+'（確約ではありません）。';
  const selected=[...document.querySelectorAll('[data-dish]:checked')].map(input=>input.dataset.dish);
  if(selected.length&&document.querySelector('#visit-time').value==='ディナー')result.textContent+=' 料理の参考メモ：'+selected.join('、')+' / 合計 '+document.querySelector('#receipt-total').textContent+'。2名で分ける想定の組み合わせです。来店人数に合わせた換算や注文は行っていません。';
});

const visitDate=document.querySelector('#visit-date');
visitDate.addEventListener('input',()=>{
  const closed=visitDate.value&&new Date(visitDate.value+'T12:00:00').getDay()===2;
  const message=closed?'火曜日は定休日の設定です。別の日をお選びください。':'';
  visitDate.setCustomValidity(message);visitDate.setAttribute('aria-invalid',String(Boolean(closed)));
  document.querySelector('#visit-date-error').textContent=message;
});
document.querySelector('#booking-form').addEventListener('input',()=>document.querySelector('#booking-result').hidden=true);
document.querySelectorAll('[data-dish]').forEach(input=>input.addEventListener('change',()=>document.querySelector('#booking-result').hidden=true));
document.querySelector('#visit-time').addEventListener('change',()=>{
  document.querySelector('#dinner-note').textContent=document.querySelector('#visit-time').value==='ランチ'?'ランチの確認には、ディナーの料理メモを含めません。':'料理選びは2名で分けるディナーの参考です。人数を変えても金額は自動換算されません。';
});
