let savedLook='';const memo=document.createElement('p');memo.className='selected-style-note';memo.hidden=true;document.querySelector('#appointment-form').prepend(memo);document.querySelectorAll('[data-save-look]').forEach(button=>button.addEventListener('click',()=>{savedLook=button.getAttribute('aria-pressed')==='true'?'':button.dataset.saveLook;document.querySelectorAll('[data-save-look]').forEach(b=>{const selected=b.dataset.saveLook===savedLook;b.setAttribute('aria-pressed',String(selected));b.querySelector('span').textContent=selected?'✓':'＋';});document.querySelector('#saved-style').textContent=savedLook?'気になるスタイル：'+savedLook:'気になるスタイルを選ぶと、ここにメモが残ります。';memo.hidden=!savedLook;memo.textContent='スタイルのメモ：'+savedLook;}));
document.querySelector('.style-memo a').addEventListener('click',()=>document.querySelector('#service').focus({preventScroll:true}));

const salonServices=['カット','カット + カラー','トリートメント（他メニューに追加）'];
document.querySelectorAll('.menu-list article').forEach((article,index)=>{
  const button=document.createElement('button');button.type='button';button.className='service-choice';button.textContent='このメニューを相談する ↗';
  article.append(button);
  button.addEventListener('click',()=>{
    document.querySelector('#service').value=salonServices[index];
    document.querySelector('#appointment-result').hidden=true;
    document.querySelector('#appointment').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
    document.querySelector('#service').focus({preventScroll:true});
  });
});
document.querySelectorAll('#service,#preference,[data-save-look]').forEach(field=>field.addEventListener(field.tagName==='BUTTON'?'click':'change',()=>document.querySelector('#appointment-result').hidden=true));
