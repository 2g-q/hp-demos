import {mountHomeLayout} from './home-layout.js?v=31ff605936d7';
const titles={home:'ホーム',cost:'原価・出来高',billing:'請求・分類集計',graph:'グラフ',print:'帳票',meeting:'会議事項',notifications:'通知・承認',files:'ファイル',search:'横断検索',schedule:'社員カレンダー',attendance:'勤怠'};
const query=new URLSearchParams(location.search),rawView=query.get('view'),requested=({month:'cost',classification:'billing'})[rawView]||rawView,view=Object.hasOwn(titles,requested)?requested:'home';document.body.dataset.portalView=view;document.querySelector('#page-title').textContent=titles[view];document.querySelector('#page-title').hidden=view==='home';document.title='timeInc. | '+titles[view];
import {ledgerClassification, monthlyExample} from './aggregation.js?v=6038ddf74182';
import {billingExample, costExample} from './aggregation-fixture.js?v=d115e69009ae';
import {mountBilling} from './billing-ui.js?v=cd4a3cd13028';
import {mountBillingGraph} from './billing-graph-ui.js?v=bce5b06bce32';
import {mountWeeklyActual} from './weekly-actual-ui.js?v=6e25c15bf51b';
import {mountBillingReport} from './billing-report-ui.js?v=f78ab2f9c70d';
const reportStyle=document.createElement('link');reportStyle.rel='stylesheet';reportStyle.href=new URL('./billing-report.css',import.meta.url).href;document.head.append(reportStyle);
import weeklyActualContext from './weekly-actual-context.js?v=9dae78c5f46b';
import billingFixture from './overview.js?v=99aeb88f17bf';
const content=document.querySelector('#portal-content'),theme=document.querySelector('#theme');theme.addEventListener('click',()=>document.body.classList.toggle('dark'));
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const table=(heads,rows)=>'<div class="table-scroll"><table><thead><tr>'+heads.map(x=>'<th>'+escape(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map((x,i)=>'<td data-label="'+escape(heads[i])+'">'+escape(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
const yen=value=>value.toLocaleString('ja-JP',{maximumFractionDigits:10})+'円';
const scope=text=>'<p id="aggregation-scope" class="muted-text aggregation-scope">'+escape(text)+'</p>';
const card=(title,body,action='')=>'<section class="portal-card">'+(title===titles[view]&&!action?'':'<div class="toolbar"><h2>'+title+'</h2>'+action+'</div>')+body+'</section>';
const app=(key,label,icon,id='')=>'<a class="app" '+(id?'id="'+id+'"':'')+' href="'+(key==='weekly'?'./weekly/?board=1':key==='ledger'?'./ledger/':'./?view='+key)+'"><span class="app-icon">'+icon+'</span>'+label+'</a>';
const tabs=(items)=>'<div class="tabs" role="tablist">'+items.map((x,i)=>'<button role="tab" data-tab="'+i+'" aria-selected="'+(i===0)+'">'+x+'</button>').join('')+'</div><div id="tab-content"></div>';
const sampleRows=[['業務A','担当A','確認中'],['業務B','担当B','作業中'],['業務C','担当C','確認済み']];
const viewLink=(key,label,tab='')=>'<a class="view-link" href="./?view='+key+(tab?'&tab='+tab:'')+'">'+label+'</a>';
if(view==='home'){
 const icon=paths=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';
 const icons={ledger:icon('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>'),cost:icon('<path d="M4 20V10m7 10V4m7 16v-7M3 20h18"/>'),billing:icon('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6m-6 4h6"/>'),graph:icon('<path d="M4 4v16h16M7 15l4-5 4 2 5-7"/>'),weekly:icon('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M8 15h2m4 0h2"/>')};
 const quick=(key,title,detail)=>'<a class="dash-quick" href="./?view='+key+'"><span class="dash-icon">'+icons[key]+'</span><span><strong>'+title+'</strong><small>'+detail+'</small></span><span class="dash-arrow" aria-hidden="true">↗</span></a>';
 content.innerHTML='<div class="dashboard"><header class="dash-heading"><h1>業務ホーム</h1><a href="./?view=search" class="dash-search">社内情報を検索 <span aria-hidden="true">⌕</span></a></header><div class="dash-top"><section class="dash-hero"><span class="dash-icon">'+icons.weekly+'</span><h2>週間工程表</h2><p>案件ごとの予定と実績を確認</p><a class="dash-primary" id="open-weekly" href="./weekly/?board=1">週間工程表を開く <span aria-hidden="true">→</span></a><div class="dash-hero-links"><a href="./?view=meeting">会議事項</a><a href="./?view=schedule">社員カレンダー</a></div></section><section class="dash-quick-grid" aria-label="業務を開く"><a class="dash-quick" id="open-ledger" href="./ledger/"><span class="dash-icon">'+icons.ledger+'</span><span><strong>受注台帳</strong><small>案件の登録・確認</small></span><span class="dash-arrow" aria-hidden="true">↗</span></a>'+quick('cost','原価・出来高','実績明細を確認')+quick('billing','請求・分類集計','請求内訳を確認')+quick('graph','グラフ','分類別の金額を確認')+'</section></div><div class="dash-bottom"><section class="dash-panel"><div class="dash-panel-heading"><h2>掲示板</h2><a href="./?view=files">共有ファイル <span aria-hidden="true">↗</span></a></div><div class="dash-notice"><span class="dash-dot"></span><div><strong>週次ミーティング</strong><p>会議資料の確認</p></div><a href="./?view=meeting" aria-label="週次ミーティングの会議事項を開く">開く →</a></div><div class="dash-notice"><span class="dash-dot soft"></span><div><strong>共有ファイルの更新</strong><p>業務資料・申請書</p></div><a href="./?view=files" aria-label="共有ファイルを開く">開く →</a></div></section><section class="dash-panel"><div class="dash-panel-heading"><h2>行先</h2><a href="./?view=schedule">社員カレンダー <span aria-hidden="true">↗</span></a></div>'+table(['社員','状態','行先','戻り'],[['担当A','外出','現場A','16:00'],['担当B','在席','社内','—'],['担当C','在宅','—','—'],['担当D','休み','—','—']])+'</section></div><nav class="dash-footer" aria-label="その他の業務"><a href="./?view=print">帳票</a><a href="./?view=notifications">通知・承認</a><a href="./?view=attendance">勤怠</a></nav></div>';
 mountHomeLayout(content.querySelector('.dashboard'));
}
if(view==='cost'){
 content.innerHTML=card('原価・出来高','<div class="tabs" role="tablist" aria-label="原価・出来高の表示"><button id="cost-tab-actual" role="tab" aria-selected="true">実績明細</button><button id="cost-tab-example" role="tab" aria-selected="false">計算例</button></div><div id="cost-content"></div>');
 const pane=document.querySelector('#cost-content'),mainTabs=[document.querySelector('#cost-tab-actual'),document.querySelector('#cost-tab-example')];
 let actualView=null;
 const showCost=mode=>{
  actualView?.dispose();actualView=null;pane.replaceChildren();
  mainTabs.forEach((button,i)=>{const active=(i===0?'actual':'example')===mode;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
  if(mode==='actual'){
   const currentQuery=new URL(location.href).searchParams;
   actualView=mountWeeklyActual({content:pane,fixture:billingFixture,...weeklyActualContext,initialCaseId:currentQuery.get('case'),initialWeek:currentQuery.get('week')});
   return;
  }
  pane.innerHTML=scope('受領様式の計算例（08.03・架空データ）')+'<p class="muted-text aggregation-scope">保存済みの週間実績とは別の計算例です。</p>'+tabs(['一覧','作業明細']);
  const draw=i=>{
   const result=monthlyExample(costExample);
   document.querySelector('#tab-content').innerHTML=i===0?
    '<div id="cost-calculation">'+table(['業務','入力セル数','元式の単価','当月出来高','外注費','計'],result.details.map(row=>[row.name,row.count,yen(row.rate),yen(row.amount),moneyCell(row.external),yen(row.total)]).concat([['合計','—','—',yen(result.amount),yen(result.external),yen(result.total)]]))+'</div>':
    table(['業務','日付','担当者','作業','入力セル数'],result.details.flatMap(row=>row.cells.filter(value=>value!==null).map(value=>[row.name,'—','—',String(value),1])));
  };setupTabs(draw,new URL(location.href).searchParams.get('example')==='detail'?1:0);
 };
 const chooseCost=mode=>{const url=new URL(location.href);if(mode==='example')url.searchParams.set('tab','example');else url.searchParams.delete('tab');history.replaceState(history.state,'',url);showCost(mode);};
 mainTabs.forEach((button,i)=>{button.addEventListener('click',()=>chooseCost(i===0?'actual':'example'));button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const index=event.key==='Home'?0:event.key==='End'?1:1-i;chooseCost(index===0?'actual':'example');mainTabs[index].focus();});});
 showCost(query.get('tab')==='example'?'example':'actual');
}
if(view==='graph')mountBillingGraph({content,fixture:billingFixture});
if(view==='print')mountBillingReport({content,fixture:billingFixture});
if(view==='meeting')content.innerHTML=card('週次ミーティング',table(['議題','担当','確認事項','状態'],[['入札予定','担当A','業務Aの募集予定','確認待ち'],['民間営業','担当B','業務Bの提案状況','確認中'],['外注利用','担当C','業務Cの依頼範囲','確認中'],['人員配置','担当A','翌週の現場予定','共有'],['請求状況','担当B','業務Aの今月請求','確認中'],['継続業務','担当A','業務Bの次月予定','共有'],['検討事項','担当C','業務Cの進め方','確認待ち'],['営業渉外','担当B','訪問・連絡の予定','共有'],['会社行事','担当A','社内行事の予定','共有'],['有休','担当C','翌週の休暇予定','共有'],['団体行事','担当B','参加予定の確認','確認中']]));
if(view==='notifications')content.innerHTML=card('通知・承認',table(['内容','担当','状態'],[['業務Aの確認依頼','担当A','確認待ち'],['業務Bの確認依頼','担当B','確認待ち'],['社内のお知らせ','総務','公開済み']]));
if(view==='files')content.innerHTML=card('共有ファイル',table(['ファイル','保管先','更新日','版','更新者'],[['業務資料.pdf','業務A','10/09','v3','担当A'],['申請書.xlsx','総務','10/08','v2','担当B'],['会議資料.pdf','会議','10/07','v1','担当C']]))+card('旧版一覧',table(['ファイル','更新日','版'],[['業務資料.pdf','10/02','v2'],['業務資料.pdf','09/25','v1']]));
if(view==='attendance')content.innerHTML=card('勤怠', '<div class="metric-grid"><div class="metric"><span>出勤</span><strong>—</strong></div><div class="metric"><span>退勤</span><strong>—</strong></div><div class="metric"><span>勤務時間</span><strong>—</strong></div></div><p class="muted-text">マネーフォワード 未接続</p>');
if(view==='billing'){
 mountBilling({content,fixture:billingFixture,initialCaseId:query.get('case'),initialEntryId:query.get('entry')});
}
function moneyCell(value){return value===null?'—':typeof value==='number'?yen(value):String(value);}
if(view==='schedule')content.innerHTML=card('社員の予定',table(['日付','時間','予定','担当'],[['—','—','現地確認','担当A'],['—','—','社内打合せ','担当B']]));
if(view==='search'){content.innerHTML=card('横断検索','<input id="portal-search" class="search-input" type="search" placeholder="お知らせ・社員・ファイルを検索" aria-label="横断検索"><div id="search-results"></div>');const entries=[['お知らせ','週次ミーティング','社内'],['社員','担当A','業務部'],['社員','担当B','総務'],['ファイル','業務資料.pdf','業務A'],['ファイル','申請書.xlsx','総務']];const draw=()=>{const needle=document.querySelector('#portal-search').value.trim().toLocaleLowerCase(),rows=entries.filter(r=>r.join(' ').toLocaleLowerCase().includes(needle));document.querySelector('#search-results').innerHTML=rows.length?table(['種類','名称','所属・保管先'],rows):'<p class="empty">該当する情報はありません。</p>';};document.querySelector('#portal-search').addEventListener('input',draw);draw();}
function setupTabs(draw,initial=0){const buttons=[...document.querySelectorAll('[data-tab]')];function select(i){buttons.forEach((b,n)=>{b.setAttribute('aria-selected',String(n===i));b.tabIndex=n===i?0:-1;});draw(i);}buttons.forEach((button,i)=>{button.addEventListener('click',()=>select(i));button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;select(n);buttons[n].focus();});});select(initial);}
window.portalReady=true;

for(const link of content.querySelectorAll('a[href]')){const url=new URL(link.href);if(url.origin===location.origin){url.searchParams.set('v',"e1b2234b1d42");link.href=url.href;}}
