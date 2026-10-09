import {createStore} from './storage.js';import fixture from './overview.js';
const theme=document.querySelector('#theme');theme.addEventListener('click',()=>{const dark=document.body.classList.toggle('dark');theme.textContent=dark?'ライト':'ダーク';});
async function start(){const record=createStore('ledger',fixture).read(),v=record.values;
document.querySelector('#identifier').textContent=[v.A4,v.B4,v.C4].map(x=>x===null?'（空欄）':x).join(' / ');
document.querySelector('#formal').textContent=v.D4||'（正式名未入力）';document.querySelector('#alias').textContent=fixture.alias;
for(const kind of ['ledger','weekly']){const a=document.querySelector('#open-'+kind);a.href='./'+kind+'/';a.removeAttribute('aria-disabled');}
document.querySelector('#case').hidden=false;document.querySelector('#home-status').textContent='';
document.querySelector('#search').addEventListener('input',e=>{const hit=([v.A4,v.B4,v.C4,v.D4,fixture.alias].join(' ')).toLocaleLowerCase().includes(e.target.value.trim().toLocaleLowerCase());document.querySelector('#case').hidden=!hit;document.querySelector('#empty').hidden=hit;});}
start().catch(()=>{document.querySelector('#home-status').textContent='このブラウザの保存版を確認できません。保存設定を確認してください';});window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});