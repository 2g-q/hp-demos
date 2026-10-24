document.querySelector('#appointment-form').addEventListener('submit',event=>{
  event.preventDefault();
  const service=document.querySelector('#service');
  const menu=document.querySelectorAll('.menu-list article')[service.selectedIndex];
  document.querySelector('#review-service').textContent=service.value;
  document.querySelector('#review-price').textContent=menu?menu.querySelector('div>span').textContent+'（税込・サンプル価格）'+(service.selectedIndex===2?' / 他メニューへの追加料金':''):'メニューを相談してから確認';
  document.querySelector('#review-preference').textContent=document.querySelector('#preference').value;
  document.querySelector('#review-style').textContent=savedLook||'写真はまだ選んでいません';
  const result=document.querySelector('#appointment-result');result.hidden=false;result.focus({preventScroll:true});result.scrollIntoView({block:'nearest'});
});
document.querySelector('.review-edit').addEventListener('click',()=>{document.querySelector('#appointment-result').hidden=true;document.querySelector('#service').focus();});
