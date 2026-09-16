"""Check active cover palettes, responsive shells and unchanged demo styling."""
import json, os, sys
from pathlib import Path
from bs4 import BeautifulSoup
sys.path.insert(0, '/Users/tsujiryuki/sidegig_crowdworks')
from automation.chrome_bin import chrome_real_bin
from playwright.sync_api import sync_playwright

root = Path.cwd()
catalog = (root / 'cw.html').read_text()
items = [x for x in json.loads((root / 'pf/real-covers/manifest.json').read_text())
         if './' + x['image'] in catalog]
base = os.environ.get('THEME_QA_URL', 'http://127.0.0.1:8876/')
out = Path('/private/tmp/portfolio-theme-qa')
out.mkdir(exist_ok=True)
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=str(chrome_real_bin()), headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    for item in items:
        page.goto(base + item['href'].removeprefix('./'), wait_until='networkidle')
        assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--portfolio-bg').trim()") == item['palette'][0], item['href']
        for width in [1440, 390]:
            page.set_viewport_size({'width': width, 'height': 1000})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (item['href'], width)
            page.screenshot(path=str(out / f"{item['slug']}-{width}.png"), full_page=True)
        # Disabling only the new stylesheet must not change demo internals.
        snapshot = """() => [...document.querySelectorAll('.app *, .u-window *, .window *, .review-demo-window *')].map(e=>{
          const c=getComputedStyle(e);return [c.color,c.backgroundColor,c.borderColor,c.fontSize,c.display];})"""
        before = page.evaluate(snapshot)
        page.evaluate("document.querySelector('link[href*=\"portfolio-page-theme.css\"]').disabled=true")
        after = page.evaluate(snapshot)
        assert before == after, ('demo_style_changed', item['href'])
        page.evaluate("document.querySelector('link[href*=\"portfolio-page-theme.css\"]').disabled=false")
        results.append({'href': item['href'], 'palette': item['palette'], 'widths': [1440,390], 'demo_styles_unchanged': True})
    page.goto(base + 'workbench.html#data', wait_until='networkidle')
    for tab, bg in [('shipping','#f2c967'),('review','#633f4f'),('data','#164aa0')]:
        page.locator(f'[role=tab][data-tab={tab}]').click()
        page.wait_for_function('(bg)=>getComputedStyle(document.documentElement).getPropertyValue("--portfolio-bg").trim()===bg', arg=bg)
    assert not errors, errors
    browser.close()
print(json.dumps({'pages': results, 'hash_switch': True, 'errors': errors}, ensure_ascii=False, indent=2))
