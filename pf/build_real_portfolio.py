"""Capture actual public demos and render the approved portfolio art direction.
Run from repository root. Browser interactions use only fictional demo data.
No publication or source HTML changes are performed by this script.
"""
import sys,json,html,shutil
from pathlib import Path
from bs4 import BeautifulSoup
sys.path.insert(0,'/Users/tsujiryuki/sidegig_crowdworks')
from automation.chrome_bin import chrome_real_bin
from playwright.sync_api import sync_playwright
ROOT=Path.cwd();OUT=ROOT/'pf/real-covers';RAW=OUT/'screens';RAW.mkdir(parents=True,exist_ok=True)
# Every cover has its own combination of composition, palette, motif and actual screen.
# slug, headline, category, icon, background, ink, accent, layout, motif
ART=[
('document-intake','請求書の転記を、確認する仕事に','事務・経理','document','#f5f1e9','#282824','#d63d2e','center','paper'),
('data-dashboard','売上集計を、ひとつの画面に','売上・集計','chart','#10151d','#f6f7f8','#c7f561','center','orbit'),
('workflow','受付から担当者への連絡まで','受付・連絡','link','#12594d','#ffffff','#e4f49f','right','route'),
('product-catalog','商品データを、使える形に','通販・商品管理','tag','#b8cbd3','#203743','#e5f4f5','center','sun'),
('web-watch','価格と在庫の変化を見つける','情報収集・確認','radar','#191d37','#ffffff','#ffbf70','left','radar'),
('case-management','問い合わせの対応漏れを防ぐ','問い合わせ管理','chat','#e7dced','#36283e','#715088','wide','stripes'),
('workbench-data','表のばらつきを整える','表計算・データ整理','grid','#164aa0','#ffffff','#bde3ff','bottom','grid'),
('workbench-shipping','出荷前に、不備を見つける','通販・出荷確認','box','#f2c967','#352e1c','#876028','right','steps'),
('workbench-review','AIの下書きを、人が確認','文章・承認','check','#633f4f','#fff5ec','#edb8a0','left','paper'),
('ec-support','お店の案内に沿って答える','通販・問い合わせ','chat','#d6e6dd','#244b40','#438b71','center','route'),
('cw-api-link','注文から出荷まで、つなぐ','サービス連携','link','#102a45','#ffffff','#57d8d5','wide','orbit'),
('cw-gyomu-system','見積から入金まで、まとめて管理','販売・購買管理','grid','#e8e1d3','#39372f','#a07246','bottom','steps'),
('cw-automation','毎日の手作業を、自動に','業務自動化','repeat','#44225c','#fff8ff','#d4adff','right','loop'),
('cw-dashboard','売上の変化を見渡す','売上分析','chart','#f3dace','#573126','#b55737','wide','sun'),
('ai-improvement','AIを使う仕事を決める','AI導入・業務整理','spark','#112c35','#f5fbf8','#8be2c2','bottom','orbit'),
('knowledge-search','社内資料から、答えを探す','社内の情報共有','search','#e9e5ce','#3b4434','#72834f','left','stripes'),
('studio-yohaku','設計の考え方が伝わるサイト','建築・設計事務所','building','#383f38','#f5f2e7','#c6c7a2','wide','paper'),
('stay-naginoma','滞在を想像できる宿のサイト','宿泊施設','moon','#dbe6e5','#24484c','#4c8a94','bottom','orbit'),
('relay','使い方が伝わるサービス紹介','業務サービス','window','#302d70','#ffffff','#a5b2ff','right','steps'),
('vintage-archive-inbound','海外のお客様にも伝わるサイト','多言語・店舗案内','globe','#e9c4a1','#4f2820','#9b3c26','left','sun'),
('pixel-office','働く様子を、ドット絵で','動くイラスト','pixel','#142d2c','#f0ffe5','#b2e995','wide','grid'),
('corp','会社の強みを伝えるサイト','会社案内','building','#e4eaf1','#1a3554','#547fa8','center','stripes'),
('lp-gym','体験の申込みにつながる案内','店舗集客','bolt','#20201f','#ffffff','#ecb637','left','steps'),
('lp-recruit','働く姿が見える採用サイト','採用・求人','people','#edd47d','#393325','#807435','wide','orbit'),
('dental-sakura','受診前の不安に答えるサイト','クリニック','plus','#e4efef','#234b53','#2e8697','right','route'),
('salon','お店の雰囲気が伝わるサイト','サロン・店舗紹介','flower','#4a3443','#fff0e8','#dbb4bc','bottom','paper'),
('ec-purchase','買い方に合わせた通販の画面','通販・購入画面','cart','#ad3c28','#fff8ee','#efc68b','wide','stripes'),
('cw-line','予約から来店後のご案内まで','LINE公式アカウント','chat','#193e27','#f6fff1','#bce598','right','sun'),
('sns-workflow','投稿原稿をつくり、確認する','SNS制作・承認','pencil','#f0d5dd','#5a334c','#9c557d','left','paper'),
('cw-design','伝えたいことが届くバナー','バナー・画像制作','layers','#f4e6c7','#2f3a50','#d18b39','center','grid'),
('cw-sns','投稿の見せ方を整える','SNSの投稿デザイン','heart','#4c326e','#fff5ff','#eca9c6','wide','sun'),
('sales-slides','伝える順番から、資料を整える','営業資料・スライド','slides','#22344a','#ffffff','#e2aa55','bottom','stripes'),
]
ICONS={
'document':'<path d="M14 3H5v18h14V8zM14 3v5h5M8 14l3 3 5-6"/>',
'chart':'<path d="M4 20h16M6 16v-5m6 5V4m6 12V8"/>',
'link':'<path d="M9 15l6-6M9 8l3-3a4 4 0 016 6l-3 3M15 16l-3 3a4 4 0 01-6-6l3-3"/>',
'tag':'<path d="M3 4h9l9 9-8 8-10-10z"/><circle cx="8" cy="9" r="1.5"/>',
'radar':'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l7-7"/>',
'chat':'<path d="M4 4h16v12H9l-5 4zM8 8h8M8 12h5"/>',
'grid':'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
'box':'<path d="M3 7l9-4 9 4v11l-9 4-9-4zM3 7l9 4 9-4M12 11v11M8 5l9 4"/>',
'check':'<circle cx="12" cy="12" r="9"/><path d="M7 12l3 3 7-7"/>',
'repeat':'<path d="M4 10a8 8 0 0114-5l2 2M20 3v4h-4M20 14a8 8 0 01-14 5l-2-2M4 21v-4h4"/>',
'spark':'<path d="M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/>',
'search':'<circle cx="10" cy="10" r="7"/><path d="M15 15l6 6M7 8h6M7 11h4"/>',
'building':'<path d="M4 21V4h11v17M15 10h5v11M8 8h3M8 12h3M8 16h3M2 21h20"/>',
'moon':'<path d="M19 15A9 9 0 019 3a9 9 0 1010 12z"/>',
'window':'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h1M11 6.5h1"/>',
'globe':'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
'pixel':'<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
'bolt':'<path d="M14 2L5 13h6l-1 9 9-12h-6z"/>',
'people':'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0112 0v3M16 5a3 3 0 010 6M18 14a5 5 0 013 5v2"/>',
'plus':'<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 7v10M7 12h10"/>',
'flower':'<path d="M12 12C1 6 8-2 12 8c4-10 11-2 0 4 11 6 4 14 0 4-4 10-11 2 0-4z"/>',
'cart':'<path d="M2 4h3l3 12h11l3-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
'pencil':'<path d="M4 15L15 4l5 5L9 20l-6 1zM12 7l5 5"/>',
'layers':'<path d="M2 8l10-5 10 5-10 5zM2 12l10 5 10-5M2 16l10 5 10-5"/>',
'heart':'<path d="M12 21L3 12C-2 4 8 0 12 7c4-7 14-3 9 5z"/>',
'slides':'<path d="M3 3h18v13H3zM12 16v5M8 21h8M7 12V9M12 12V6M17 12V8"/>',
}
CAPTURE={
'workflow':('.workspace',['#run']), 'web-watch':('.workspace',['#run']),
'case-management':('.workspace',[]),
'workbench-data':('#data-result',['#tab-data','#data-run']),
'workbench-shipping':('#shipping-result',['#tab-shipping','#shipping-run']),
'workbench-review':('#panel-review',['#tab-review','#draft-generate']),
'ec-support':('.u-window',['#shipping']),
'cw-api-link':('#panel-shipping .card',['#tab-shipping']),
'cw-automation':('#notice-panel',['#run']),
'cw-gyomu-system':('#v-dash',[]),'cw-dashboard':('.g-main',[]),
'ai-improvement':('.workspace',['#run']),'knowledge-search':('.workspace',['#search']),
'ec-purchase':('.workspace',['#add']),'cw-line':('.workspace',[]),
'sns-workflow':('.grid',['#generate']),'sales-slides':('#slides-panel',['#structure']),
'cw-sns':('iframe',[])}

def key(href):return href.removeprefix('./').replace('custom/','').replace('.html#','-').removesuffix('.html')
cards=BeautifulSoup(''.join((ROOT/file).read_text() for file in ['cw.html','cw-web.html','cw-social.html']),'html.parser').select('.work-card')
cardmap={key(a['href']):a for a in cards}
assert set(cardmap)=={a[0] for a in ART}

CSS='''*{box-sizing:border-box}body{margin:0;font-family:Arial,"Hiragino Sans",sans-serif}.cover{width:960px;height:600px;position:relative;overflow:hidden;color:var(--ink);background:var(--bg)}.top{position:absolute;left:34px;right:34px;top:24px;display:flex;justify-content:space-between;align-items:center;z-index:3}.category{display:flex;gap:11px;align-items:center;font-size:17px;font-weight:600}.icon{width:35px;height:35px;border-radius:9px;display:grid;place-items:center;background:var(--accent);color:var(--bg)}svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.type{font-size:12px;opacity:.8}h1{position:absolute;left:34px;right:34px;top:76px;font-size:42px;line-height:1.3;letter-spacing:-1.5px;margin:0;z-index:3}.foot{position:absolute;left:35px;top:140px;font-size:10px;opacity:.7;z-index:3}.stage{position:absolute;left:204px;top:174px;width:584px;height:402px;display:flex;align-items:center;justify-content:center;z-index:2}.screen{width:var(--sw);border:1px solid #d1d8df;border-radius:8px;background:white;box-shadow:0 20px 38px #0003;overflow:hidden;transform:rotate(var(--angle))}.screen img{display:block;width:100%;height:auto}.chrome{height:22px;display:flex;gap:4px;align-items:center;background:#f4f6f8;border-bottom:1px solid #e0e7ec;padding:0 10px}.chrome i{width:4px;height:4px;background:#b5c0cb;border-radius:50%}.chrome span{font-size:8px;color:#697987;margin-left:8px}.aside{position:absolute;left:35px;top:285px;width:145px;font-size:15px;line-height:1.9;z-index:3}.aside:before{content:"";display:block;width:29px;height:2px;background:var(--accent);margin-bottom:18px}.arrow{position:absolute;right:34px;bottom:26px;width:43px;height:43px;border:1px solid currentColor;border-radius:50%;display:grid;place-items:center;font-size:23px;opacity:.7}.decor{position:absolute;left:185px;top:161px;width:628px;height:450px;opacity:.2;color:var(--accent);pointer-events:none}.sun .decor{background:var(--accent);border-radius:50%;width:470px;height:470px;left:282px}.paper .decor{background:var(--accent);clip-path:polygon(4% 4%,95% 0,100% 100%,0 100%);opacity:.13}.orbit .decor{border:1px solid var(--accent);border-radius:50%;transform:rotate(-20deg)}.stripes .decor{background:repeating-linear-gradient(125deg,transparent 0 42px,var(--accent) 43px 44px)}.grid .decor{background-image:linear-gradient(var(--accent) 1px,transparent 1px),linear-gradient(90deg,var(--accent) 1px,transparent 1px);background-size:38px 38px;opacity:.1}.steps .decor{background:linear-gradient(135deg,transparent 35%,var(--accent) 35% 52%,transparent 52% 65%,var(--accent) 65%);opacity:.12}.route .decor{border:2px solid var(--accent);border-radius:60px 0 100px 0;transform:rotate(9deg)}.radar .decor{background:repeating-radial-gradient(circle,transparent 0 48px,var(--accent) 49px 50px);opacity:.16}.loop .decor{border:20px solid var(--accent);border-radius:160px;transform:rotate(-12deg);opacity:.12}.right .stage{left:283px;width:633px}.right .aside{left:35px;width:220px;top:258px;font-size:17px}.left .stage{left:35px;width:653px}.left .aside{left:731px;width:190px;top:258px;font-size:17px}.left .decor{left:30px}.left .arrow{right:46px}.wide .stage{left:35px;width:890px;top:207px;height:363px}.wide .aside{left:35px;top:163px;width:875px;font-size:15px;line-height:1.4}.wide .aside:before{display:none}.wide .arrow{display:none}.wide .decor{left:160px;top:185px}.bottom h1{top:506px;font-size:36px}.bottom .foot{top:563px}.bottom .stage{left:35px;top:77px;width:890px;height:393px}.bottom .aside{display:none}.bottom .decor{top:73px;left:170px}.bottom .arrow{bottom:24px}.bottom .type{font-size:12px}'''

CSS += '.right .arrow{display:none}'

def capture(page):
 for slug,*_ in ART:
  a=cardmap[slug];target=RAW/(slug+'.png')
  refresh={'workbench-data','workbench-shipping','cw-api-link','cw-automation'} if '--recapture-tall' in sys.argv else set()
  if '--recapture-async' in sys.argv:refresh|={'workflow','web-watch','ai-improvement','knowledge-search','workbench-review','cw-automation'}
  if target.exists() and slug not in refresh:continue
  prior=Path('/private/tmp/minato-real-cover-proofs')/(slug+'.png')
  if slug in ['document-intake','data-dashboard','product-catalog']:
   shutil.copyfile(prior,target);continue
  if slug not in CAPTURE:
   src=a.img['src'].split('?')[0].removeprefix('./')
   assert 'editorial/' not in src,slug
   dest=RAW/(slug+Path(src).suffix);shutil.copyfile(ROOT/src,dest);continue
  selector,actions=CAPTURE[slug]
  # These two destinations describe services, not an interactive application.
  # Their cover explicitly names a related local demo rather than inventing an API UI.
  route={'cw-api-link':'workbench.html#shipping','cw-automation':'web-watch.html'}.get(slug,a['href'].removeprefix('./'))
  page.goto('https://2g-q.github.io/hp-demos/'+route,wait_until='networkidle')
  for button in actions:
   page.locator(button).click();page.wait_for_timeout(2700 if button in ['#run','#draft-generate'] else 200)
   page.wait_for_function('(selector)=>!document.querySelector(selector).disabled',arg=button,timeout=30000)
  page.add_style_tag(content='.app,.content,.u-window,.u-window-body{max-height:none!important;height:auto!important;overflow:visible!important}html{scroll-behavior:auto!important}')
  page.locator(selector).first.screenshot(path=str(target))
  print('CAPTURED',slug,flush=True)

def render(page):
 from PIL import Image
 checks=[];manifest=[];proofs=[]
 for idx,(slug,title,category,icon,bg,ink,accent,layout,motif) in enumerate(ART):
  src=next(RAW.glob(slug+'.*'));w,h=Image.open(src).size;ratio=h/w
  stagew={'center':584,'right':633,'left':653,'wide':890,'bottom':890}[layout]
  stageh={'wide':363,'bottom':393}.get(layout,402)
  sw=min(stagew-34,(stageh-50)/ratio)
  desc=cardmap[slug].select_one('.desc').get_text()
  # Use the existing, evidence-bound description, with no invented claims.
  short=desc.split('。')[0]
  website=slug in ['studio-yohaku','stay-naginoma','relay','vintage-archive-inbound','corp','lp-gym','lp-recruit','dental-sakura','salon']
  typ='サイト制作例' if website else 'デザイン制作例' if slug in ['cw-design','cw-sns','pixel-office'] else '操作・支援の制作例'
  style=f'--bg:{bg};--ink:{ink};--accent:{accent};--sw:{sw:.2f}px;--angle:{[-1,0,1][idx%3]}deg'
  content=f'''<!doctype html><meta charset="utf-8"><style>{CSS}</style><article class="cover {layout} {motif}" style="{style}"><div class="decor"></div><div class="top"><div class="category"><span class="icon"><svg viewBox="0 0 24 24">{ICONS[icon]}</svg></span>{category}</div><span class="type">{typ}</span></div><h1>{html.escape(title)}</h1><div class="foot">MINATO AI・IT LAB / 制作例</div><div class="aside">{html.escape(short)}</div><div class="stage"><div class="screen"><div class="chrome"><i></i><i></i><i></i><span>実際の制作例画面</span></div><img src="{src.as_uri()}"></div></div><div class="arrow">↗</div></article>'''
  screen_label={'cw-api-link':'関連デモ / 出荷データの確認画面','cw-automation':'関連デモ / 情報収集後の通知画面'}.get(slug,'実際の制作例画面')
  content=content.replace('実際の制作例画面',screen_label)
  if slug == 'product-catalog':
   content=content.replace('class="icon"','class="icon" style="color:var(--ink)"')
  page.set_content(content);page.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)');page.evaluate('document.fonts.ready')
  c=page.locator('.cover')
  result=c.evaluate('''el=>{let c=el.getBoundingClientRect(),f=el.querySelector('.screen').getBoundingClientRect(),h=el.querySelector('h1').getBoundingClientRect(),a=el.querySelector('.aside').getBoundingClientRect(),i=el.querySelector('img');const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;return {frameInside:f.left>=c.left&&f.right<=c.right&&f.top>=c.top&&f.bottom<=c.bottom,titleClear:!overlap(h,f),asideClear:getComputedStyle(el.querySelector('.aside')).display==='none'||!overlap(a,f),ratioPreserved:Math.abs(i.offsetHeight/i.offsetWidth-i.naturalHeight/i.naturalWidth)<.005,titleFits:el.querySelector('h1').scrollHeight<=62}}''')
  checks.append({'slug':slug,**result});assert all(result.values()),checks[-1]
  filename=slug+'.jpg';c.screenshot(path=str(OUT/filename),type='jpeg',quality=92)
  manifest.append({'slug':slug,'href':cardmap[slug]['href'],'title':title,'category':category,'icon':icon,'palette':[bg,ink,accent],'layout':layout,'motif':motif,'source':str(src.relative_to(ROOT)),'image':str((OUT/filename).relative_to(ROOT)),'screenLabel':screen_label,'relatedDemo':{'cw-api-link':'workbench.html#shipping','cw-automation':'web-watch.html'}.get(slug)})
  proofs.append(f'<figure><img src="{(OUT/filename).as_uri()}"><figcaption>{html.escape(cardmap[slug].h3.get_text())}</figcaption></figure>')
  print('RENDERED',slug,flush=True)
 (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
 (OUT/'checks.json').write_text(json.dumps(checks,indent=2))
 page.set_viewport_size({'width':1440,'height':900})
 page.set_content('<style>body{margin:0;background:#eceff1;font:15px sans-serif}main{padding:18px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}figure{margin:0}img{width:100%;display:block}figcaption{padding:9px}</style><main>'+''.join(proofs)+'</main>')
 page.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)');page.screenshot(path='/private/tmp/portfolio-final-contact.png',full_page=True)

if __name__=='__main__':
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=str(chrome_real_bin()),headless=True)
  page=b.new_page(viewport={'width':1280,'height':1000},device_scale_factor=1.5)
  # Local file origin permits embedding captured local images in render-only HTML.
  if '--render-only' not in sys.argv:capture(page)
  page.goto((ROOT/'cw.html').as_uri());page.set_viewport_size({'width':960,'height':600});render(page);b.close()
