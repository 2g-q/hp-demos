// The kitchen photograph is authored in the opening spread in index.html.
function updateDinner(){const selected=[...document.querySelectorAll('[data-dish]:checked')];const receipt=document.querySelector('#receipt-items');receipt.replaceChildren(...selected.map(item=>{const row=document.createElement('div');row.className='receipt-row';const name=document.createElement('span');name.textContent=item.dataset.dish;const price=document.createElement('span');price.textContent='¥'+Number(item.value).toLocaleString('ja-JP');row.append(name,price);return row;}));if(!selected.length){const note=document.createElement('p');note.textContent='食べたい料理を選んでください';note.style.fontSize='10px';receipt.append(note);}document.querySelector('#receipt-total').textContent='¥'+selected.reduce((total,item)=>total+Number(item.value),0).toLocaleString('ja-JP');}document.querySelectorAll('[data-dish]').forEach(input=>input.addEventListener('change',updateDinner));updateDinner();
document.querySelector('.dinner-receipt>a').addEventListener('click',()=>{
  document.querySelector('#visit-time').value='ディナー';document.querySelector('#party-size').value='2名';
  document.querySelector('#visit-time').dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelector('#booking-result').hidden=true;document.querySelector('#visit-date').focus({preventScroll:true});
});
document.querySelector('#booking-form').addEventListener('submit',()=>{
  const result=document.querySelector('#booking-result');
  document.querySelector('#review-seat').textContent=document.querySelector('#seat').value;
  const selected=[...document.querySelectorAll('[data-dish]:checked')].map(input=>input.dataset.dish);
  const dinner=selected.length>0&&document.querySelector('#visit-time').value==='ディナー';
  document.querySelector('#review-dinner').hidden=!dinner;
  document.querySelector('#review-dishes').textContent=dinner?selected.join('、'):'';
  document.querySelector('#review-total').textContent=dinner?document.querySelector('#receipt-total').textContent:'';
  result.focus({preventScroll:true});result.scrollIntoView({block:'nearest'});
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
document.querySelector('.review-edit').addEventListener('click',()=>{document.querySelector('#booking-result').hidden=true;visitDate.focus();});
