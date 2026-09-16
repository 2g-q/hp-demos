"""Capture the actual refreshed site viewport, never an invented mockup."""
import sys
from pathlib import Path
sys.path.insert(0, '/Users/tsujiryuki/sidegig_crowdworks')
from automation.chrome_bin import chrome_real_bin
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=str(chrome_real_bin()),headless=True)
    page=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
    for slug in ['corp','lp-recruit','dental-sakura']:
        page.goto('http://127.0.0.1:8876/assets/demo-previews/'+slug+'.html',wait_until='networkidle')
        page.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)')
        page.screenshot(path=str(Path('pf')/(slug+'.jpg')),type='jpeg',quality=90)
    browser.close()
