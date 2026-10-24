const menu=document.querySelector('.menu'),nav=document.querySelector('nav');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.focus()}});document.querySelectorAll('[data-course]').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#course').value=b.dataset.course;document.querySelector('#calendar').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});document.querySelector('#course').focus({preventScroll:true})}));const dialog=document.querySelector('dialog');document.querySelector('#class-form').addEventListener('submit',e=>{e.preventDefault();const course=document.querySelector('#course').value,day=document.querySelector('#day').value;document.querySelector('#choice').textContent=`${course} / ${day}`;document.querySelector('#review-class').textContent=course==='陶芸'?'はじめての陶芸':'自由に描くアート';document.querySelector('#review-duration').textContent=course==='陶芸'?'約120分':'約90分';document.querySelector('#review-class-price').textContent=course==='陶芸'?'¥5,500（税込）/ 材料・焼成込':'¥4,400（税込）/ 画材込';dialog.showModal()});dialog.querySelectorAll('.close,.done').forEach(b=>b.addEventListener('click',()=>dialog.close()));

const interest=document.querySelector('#class-interest');
function updateClassHint(){interest.placeholder=document.querySelector('#course').value==='陶芸'?'例：朝のスープに使う器':'例：好きな色で描く小さな絵';}
document.querySelector('#course').addEventListener('change',updateClassHint);
document.querySelectorAll('[data-course]').forEach(button=>button.addEventListener('click',updateClassHint));
const courseMemos={'陶芸':'','アート':''};let previousCourse=document.querySelector('#course').value;
function retainCourseMemo(){
  courseMemos[previousCourse]=interest.value;
  previousCourse=document.querySelector('#course').value;
  interest.value=courseMemos[previousCourse];
  updateClassHint();
}
document.querySelector('#course').addEventListener('change',retainCourseMemo);
document.querySelectorAll('[data-course]').forEach(button=>button.addEventListener('click',retainCourseMemo));
document.querySelector('[data-journey-course]').addEventListener('click',()=>{
  document.querySelector('#course').value='陶芸';retainCourseMemo();
  document.querySelector('#course').focus({preventScroll:true});
});
document.querySelector('.done').addEventListener('click',()=>document.querySelector('#course').focus());
document.querySelector('#class-form').addEventListener('submit',()=>{
  const course=document.querySelector('#course').value;
  document.querySelector('#choice').textContent=course+' / 希望する曜日：'+document.querySelector('#day').value+'（開催日未定）';
  const prep=course==='陶芸'?'陶芸の準備：汚れてもよい服装で。器は当日には持ち帰れません。焼成後の受取時期・方法は未設定です。':'アートの準備：汚れてもよい服装で。画材はクラスに含まれる設定で、作品は当日持ち帰れます。';
  document.querySelector('#class-preparation').textContent=prep+(interest.value.trim()?' つくってみたいもの：'+interest.value.trim():'');
});
