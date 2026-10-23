const rooms={lake:{image:'room.jpg',caption:'LAKE TERRACE',en:'Lake terrace',name:'レイクテラス',description:'窓辺で本を開いたり、テラスで朝食をとったり。水面の移ろいを眺めて過ごす、ふたり向けの部屋です。',size:'48㎡ + テラス',guests:'2名',equipment:'バス / ミニキッチン / Wi-Fi'},forest:{image:'cabin.jpg',caption:'FOREST CABIN',en:'Forest cabin',name:'フォレストキャビン',description:'木々に囲まれた独立棟。家族や気の合う友人と、まわりを気にせずくつろぐ時間を。',size:'65㎡ + デッキ',guests:'2〜4名',equipment:'バス / キッチン / ダイニング'}};
const tabs=[...document.querySelectorAll('[data-room]')];
function selectRoom(button){const room=rooms[button.dataset.room];tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===button));t.tabIndex=t===button?0:-1;});document.querySelector('#room-panel').setAttribute('aria-labelledby',button.id);document.querySelector('#room-image').src='assets/'+room.image;document.querySelector('#room-image').alt=room.name+'の参考イメージ';for(const field of ['caption','en','name','description','size','guests','equipment'])document.querySelector('#room-'+field).textContent=room[field];document.querySelector('#selected-room').value=room.name;validateGuests();}
tabs.forEach((button,i)=>{button.tabIndex=i===0?0:-1;button.addEventListener('click',()=>selectRoom(button));button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(i+1)%tabs.length;if(event.key==='ArrowLeft')next=(i-1+tabs.length)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();tabs[next].focus();selectRoom(tabs[next]);}})});
const dateInput=document.querySelector('#checkin');const today=new Date();dateInput.min=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
const guestInput=document.querySelector('#guests');
function validateGuests(){
  const tooMany=document.querySelector('#selected-room').value==='レイクテラス'&&Number(guestInput.value)>2;
  const message=tooMany?'レイクテラスは2名までです。人数を2名にするか、フォレストキャビンをお選びください。':'';
  guestInput.setCustomValidity(message);guestInput.setAttribute('aria-invalid',String(tooMany));document.querySelector('#guest-error').textContent=message;
  document.querySelector('#booking-result').hidden=true;
}
guestInput.addEventListener('change',validateGuests);
document.querySelector('#selected-room').addEventListener('change',event=>selectRoom(tabs.find(t=>rooms[t.dataset.room].name===event.target.value)));
document.querySelector('#booking-form').addEventListener('input',()=>{document.querySelector('#booking-result').hidden=true;});
document.querySelector('#booking-form').addEventListener('submit',event=>{
  event.preventDefault();
  const nights=Number(document.querySelector('#nights').value);
  const checkout=new Date(dateInput.value+'T12:00:00');checkout.setDate(checkout.getDate()+nights);
  const end=[checkout.getFullYear(),String(checkout.getMonth()+1).padStart(2,'0'),String(checkout.getDate()).padStart(2,'0')].join('-');
  const result=document.querySelector('#booking-result');result.hidden=false;
  result.textContent=document.querySelector('#selected-room').value+' / '+guestInput.value+'名 / '+nights+'泊。チェックイン '+dateInput.value+'、チェックアウト '+end+'。客室・日程の確認デモです。空室や料金は照会しておらず、予約は成立していません。';
});
