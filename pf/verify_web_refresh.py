"""Render every website example; verify refreshed demos without external writes."""
import json, os, sys
from pathlib import Path
from bs4 import BeautifulSoup
sys.path.insert(0, '/Users/tsujiryuki/sidegig_crowdworks')
from automation.chrome_bin import chrome_real_bin
from playwright.sync_api import sync_playwright

root = Path.cwd()
base = os.environ.get('WEB_QA_URL', 'http://127.0.0.1:8876/')
before = '--before' in sys.argv
out = Path('/private/tmp/web-refresh-before' if before else '/private/tmp/web-refresh-after')
out.mkdir(exist_ok=True)
soup = BeautifulSoup((root/'cw-web.html').read_text(), 'html.parser')
hrefs = [a['href'].removeprefix('./') for a in soup.select('.work-card')]
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=str(chrome_real_bin()), headless=True)
    page = browser.new_page(viewport={'width':1440,'height':1000}, reduced_motion='reduce')
    errors, writes = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: writes.append(r.url) if r.method not in ['GET','HEAD'] else None)
    for href in hrefs:
        slug = Path(href).stem
        markup = BeautifulSoup((root/href).read_text(),'html.parser')
        iframe = markup.select_one('iframe')
        target = iframe['src'] if iframe else href
        page.goto(base+target, wait_until='networkidle')
        page.evaluate("document.querySelectorAll('img').forEach(i=>i.loading='eager')")
        page.wait_for_function("Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)")
        for width in [1440,390]:
            page.set_viewport_size({'width':width,'height':1000})
            page.wait_for_timeout(200)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), (slug,width)
            page.screenshot(path=str(out/f'{slug}-{width}.png'))
        if not before and slug in ['corp','lp-recruit','dental-sakura']:
            if slug == 'corp':
                page.locator('[data-audience="work"]').click()
                assert page.locator('#audience-inquiry').input_value() == 'work'
            elif slug == 'lp-recruit':
                page.locator('[data-time="3"]').click()
                assert page.locator('#day-time').inner_text() == '14:00'
                page.locator('[data-employment="part"]').click()
                assert page.locator('#employment-inquiry').input_value() == 'part'
            else:
                page.locator('[data-care="visit"]').click()
                assert page.locator('#care-inquiry').input_value() == 'visit'
            page.locator('[data-demo-form] button[type="submit"]').click()
            assert '外部への送信' in page.locator('[data-demo-form] output').inner_text()
        results.append({'page':href,'target':target,'widths':[1440,390],'images_loaded':True})
    assert not errors, errors
    assert not writes, writes
    browser.close()
print(json.dumps({'pages':results,'errors':errors,'network_writes':writes},ensure_ascii=False,indent=2))
