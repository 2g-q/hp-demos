"""Read-only browser QA for cw.html cover refresh; evidence outside the repository."""
import sys,json,hashlib,subprocess,os
from pathlib import Path
from bs4 import BeautifulSoup
sys.path.insert(0,'/Users/tsujiryuki/sidegig_crowdworks')
from automation.chrome_bin import chrome_real_bin
from playwright.sync_api import sync_playwright
root=Path.cwd();manifest=json.loads((root/'pf/real-covers/manifest.json').read_text())
base=os.environ.get('COVER_QA_BASE','f26dfd6')
old=BeautifulSoup(subprocess.check_output(['git','show',base+':cw.html'],text=True),'html.parser')
new=BeautifulSoup((root/'cw.html').read_text(),'html.parser')
def inventory(s):return [(a['href'],a.get('target'),str(a.select_one('.work-body'))) for a in s.select('.work-card')]
assert inventory(old)==inventory(new)
assert len(manifest)==32
assert len({hashlib.sha256((root/x['image']).read_bytes()).hexdigest() for x in manifest})==32
assert len({tuple(x['palette']) for x in manifest})==32
assert all(all(v for k,v in c.items() if k!='slug') for c in json.loads((root/'pf/real-covers/checks.json').read_text()))
url=os.environ.get('COVER_QA_URL','http://127.0.0.1:8876/cw.html')
results={'url':url,'cards':32,'unique_images':32,'unique_palettes':32,'links_and_body_unchanged':True,'cover_bounds_passed':32,'widths':[]}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=str(chrome_real_bin()),headless=True)
 page=b.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url,wait_until='networkidle')
 page.evaluate("document.querySelectorAll('details').forEach(e=>e.open=true);document.querySelectorAll('img').forEach(e=>e.loading='eager')")
 page.wait_for_function("Array.from(document.querySelectorAll('.work-card img')).every(i=>i.complete&&i.naturalWidth>0)")
 assert page.locator('.work-card img[src^="./pf/real-covers/"]').count()==32
 # Trigger the site's actual once-only scroll reveals before full-page evidence.
 for card in page.locator('.work-card').all():
  card.scroll_into_view_if_needed();page.wait_for_timeout(100)
 page.wait_for_timeout(700)
 assert page.locator('.work-card').evaluate_all("els=>els.every(e=>Number(getComputedStyle(e).opacity)>.99)")
 for width in [1440,768,390,360]:
  page.set_viewport_size({'width':width,'height':1000})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=f'/private/tmp/portfolio-refresh-{width}.png',full_page=True)
  results['widths'].append({'width':width,'images_loaded':32,'horizontal_overflow':False})
 assert not errors,errors
 results['page_errors']=errors;b.close()
print(json.dumps(results,ensure_ascii=False,indent=2))
