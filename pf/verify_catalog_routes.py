"""Check category split without changing customer data or browser profiles."""
import json, os, subprocess, sys
from pathlib import Path
from bs4 import BeautifulSoup
sys.path.insert(0, '/Users/tsujiryuki/sidegig_crowdworks')
from automation.chrome_bin import chrome_real_bin
from playwright.sync_api import sync_playwright

root = Path.cwd()
files = ['cw.html', 'cw-web.html', 'cw-social.html']
soups = [BeautifulSoup((root / file).read_text(), 'html.parser') for file in files]
old = BeautifulSoup(subprocess.check_output(['git', 'show', 'c8ae9b0:cw.html'], text=True), 'html.parser')
def inventory(s):
    return [(a['href'], a.select_one('.work-body').get_text(' ', strip=True)) for a in s.select('.work-card')]
# The owner approved reordered web examples and three refreshed thumbnails.
refreshed = {'./corp.html','./lp-recruit.html','./dental-sakura.html'}
current_inventory = sum([inventory(s) for s in soups], [])
assert sorted(h for h,_ in inventory(old)) == sorted(h for h,_ in current_inventory)
assert sorted(x for x in inventory(old) if x[0] not in refreshed) == sorted(x for x in current_inventory if x[0] not in refreshed)
old_images = {a['href']:a.img['src'] for a in old.select('.work-card')}
for soup in soups:
    for a in soup.select('.work-card'):
        if a['href'] not in refreshed: assert a.img['src'] == old_images[a['href']]
assert [len(s.select('.work-card')) for s in soups] == [17, 10, 5]
assert soups[0].select_one('#tools .work-card[href="./ec-purchase.html"]')
assert not soups[1].select_one('.work-card[href="./ec-purchase.html"]')
for file, soup in zip(files, soups):
    assert not soup.select('details')
    assert len(soup.select('.portfolio-nav a')) == 3
    assert soup.select_one('.portfolio-nav [aria-current="page"]')['href'] == './' + file
    assert all(a.get('target') == '_blank' for a in soup.select('.work-card'))
    assert all(not a.get('target') for a in soup.select('.portfolio-nav a'))
    assert soup.select_one('a[href="mailto:minato.ai.lab@gmail.com"]')
    assert soup.select_one('a[href="https://page.line.me/091usyfe"]')
    assert 'CWで相談する' not in soup.get_text()
    for item in soup.select('[src], link[href]'):
        value = item.get('src') or item.get('href')
        if value.startswith(('http:', 'https:', 'data:')): continue
        assert (root / value.split('?')[0].removeprefix('./')).exists(), value

base = os.environ.get('CATALOG_QA_URL', 'http://127.0.0.1:8876/')
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=str(chrome_real_bin()), headless=True)
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    for file in files + ['cases.html', 'index.html', 'pricing.html']:
        page.goto(base + file, wait_until='networkidle')
        for width in [1440, 390, 360]:
            page.set_viewport_size({'width': width, 'height': 1000})
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), (file, width)
        if file in files:
            page.evaluate("document.querySelectorAll('.work-card img').forEach(i=>i.loading='eager')")
            page.wait_for_function("Array.from(document.querySelectorAll('.work-card img')).every(i=>i.complete&&i.naturalWidth>0)")
            for card in page.locator('.work-card').all(): card.scroll_into_view_if_needed()
            page.wait_for_timeout(700)
            assert page.locator('.work-card').evaluate_all("els=>els.every(e=>Number(getComputedStyle(e).opacity)>.99)")
        if file == 'cases.html':
            for card in page.locator('.case-story').all():
                card.scroll_into_view_if_needed()
                page.wait_for_timeout(150)
            page.wait_for_timeout(700)
            assert page.locator('.case-story').count() == 3
            assert page.locator('.case-story').evaluate_all("els=>els.every(e=>Number(getComputedStyle(e).opacity)>.99)")
        page.screenshot(path='/private/tmp/catalog-route-' + file + '.png', full_page=True)
        if file in files + ['cases.html']:
            page.evaluate('scrollTo(0,0)')
            for width in [1440,390]:
                page.set_viewport_size({'width':width,'height':1000})
                page.wait_for_timeout(200)
                page.screenshot(path=f'/private/tmp/catalog-top-{file}-{width}.png')
        results.append({'page': file, 'widths': [1440,390,360], 'overflow': False})
    page.goto(base + 'cw.html')
    for file in files[1:] + files[:1]:
        page.locator('.portfolio-nav a[href="./'+file+'"]').click()
        page.wait_for_url('**/'+file)
        assert len(page.context.pages) == 1
    for fragment, target in [('web','cw-web.html'),('sns','cw-social.html'),('cases','cases.html'),('pricing','pricing.html')]:
        page.goto(base + 'cw.html#' + fragment)
        page.wait_for_url('**/'+target)
    assert not errors, errors
    browser.close()
print(json.dumps({'pages':results,'preserved_cards':32,'same_tab_navigation':True,'legacy_links':True,'errors':errors}, ensure_ascii=False, indent=2))
