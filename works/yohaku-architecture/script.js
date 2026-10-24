const filterButtons=[...document.querySelectorAll('[data-filter]')];const projects=[...document.querySelectorAll('[data-project]')];
filterButtons.forEach(button=>button.addEventListener('click',()=>{filterButtons.forEach(other=>{other.classList.toggle('active',button===other);other.setAttribute('aria-pressed',String(button===other));});projects.forEach(project=>project.hidden=button.dataset.filter!=='all'&&project.dataset.category!==button.dataset.filter);document.querySelector('.project-grid').classList.toggle('filtered',button.dataset.filter!=='all');}));
const data={light:{title:'光と暮らす家',image:'living-real.webp',description:'白い面に自然光を受け、木の床で温かさを添える。家具と窓の関係から考える、住まいのイメージです。'},white:{title:'街角の白い輪郭',image:'facade.jpg',description:'外壁の面と空の境界を読み解く、外観のスタディ。凹凸に落ちる影が、時間によって表情を変えます。'},table:{title:'ひらかれたアトリエ',image:'studio.jpg',description:'大きなテーブルが、作業と対話をゆるやかにつなぐ。チームの距離感から考えるワークプレイスです。'}};
const dialog=document.querySelector('#project-dialog');projects.forEach(button=>button.addEventListener('click',()=>{const project=data[button.dataset.project];document.querySelector('#dialog-title').textContent=project.title;document.querySelector('#dialog-image').src='assets/'+project.image;document.querySelector('#dialog-image').alt=project.title+'の参考写真';document.querySelector('#dialog-description').textContent=project.description;dialog.showModal();}));document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
document.querySelector('#consult-button').addEventListener('click',()=>{const type=document.querySelector('#consult-type').value;const notes={'住宅の新築':'土地の状況、ご家族の暮らし方、予算の目安をお聞かせください。土地が未定でも、いま考えていることから相談できます。','リノベーション':'建物の種類、変えたいところ、残したいところを整理してみてください。図面や写真があれば、相談の手がかりになります。','店舗・オフィス':'事業の内容、利用する人数、開業・移転の時期、物件の状況をお聞かせください。'};document.querySelector('#review-type').textContent=type;document.querySelector('#review-preparation').textContent=notes[type];const result=document.querySelector('#consult-result');result.hidden=false;});

let chosenStudy='';
projects.forEach(button=>button.addEventListener('click',()=>{
  document.querySelector('#use-study').dataset.project=button.dataset.project;
  document.querySelector('#use-study').dataset.category=button.dataset.category;
}));
document.querySelector('#use-study').addEventListener('click',event=>{
  const button=event.currentTarget;
  chosenStudy=data[button.dataset.project].title;
  const type=document.querySelector('#consult-type');
  type.value=button.dataset.project==='table'?'店舗・オフィス':'住宅の新築';
  const note=document.querySelector('#selected-study');note.hidden=false;note.textContent='参考にしたい空間：'+chosenStudy+'（写真によるスタディ）';
  document.querySelector('#clear-study').hidden=false;
  updatePriorityHint();
  document.querySelector('#consult-result').hidden=true;
  dialog.close();
  document.querySelector('#contact').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
  type.focus({preventScroll:true});
});
document.querySelector('#consult-button').addEventListener('click',()=>{
  const result=document.querySelector('#consult-result');
  const memo=document.querySelector('#project-priority').value.trim();
  document.querySelector('#review-study').textContent=chosenStudy||'まだ選んでいません';
  document.querySelector('#review-priority').textContent=memo||'対話しながら整理したい';
  result.focus({preventScroll:true});result.scrollIntoView({block:'nearest'});
});
document.querySelectorAll('#consult-type,#project-priority').forEach(field=>field.addEventListener('input',()=>document.querySelector('#consult-result').hidden=true));
function updatePriorityHint(){
  const commercial=document.querySelector('#consult-type').value==='店舗・オフィス';
  document.querySelector('#priority-label').textContent=commercial?'使い方・空間で大切にしたいこと（任意）':'今の暮らしで変えたいこと（任意）';
  document.querySelector('#project-priority').placeholder=commercial?'例：作業に集中できる席と、気軽に話せる場所をつくりたい。':'例：食事の支度をしながら、家族と話せる場所にしたい。';
}
document.querySelector('#consult-type').addEventListener('change',updatePriorityHint);
document.querySelector('#clear-study').addEventListener('click',()=>{
  chosenStudy='';document.querySelector('#selected-study').hidden=true;document.querySelector('#clear-study').hidden=true;
  document.querySelector('#consult-result').hidden=true;document.querySelector('#consult-type').focus();
});
document.querySelector('.review-edit').addEventListener('click',()=>{document.querySelector('#consult-result').hidden=true;document.querySelector('#project-priority').focus();});
