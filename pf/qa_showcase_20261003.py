"""Real-browser capture and smoke checks for the nine original website studies.

Use --base for the deployed GitHub Pages readback. No form is externally sent.
Browser binary follows the project's background-only single source of truth.
"""
import argparse
import asyncio
import json
import sys
from pathlib import Path

from PIL import Image
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / 'sidegig_crowdworks'))
from automation.chrome_bin import chrome_bin

SLUGS = ['nagi-stay', 'towa-corporate', 'kajitsu', 'yohaku-architecture',
         'craft-recruit', 'linen-salon', 'axis-fitness', 'ember-restaurant', 'koto-learning']


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', default='http://127.0.0.1:8765')
    parser.add_argument('--capture', action='store_true')
    parser.add_argument('--slugs', nargs='*', default=SLUGS)
    parser.add_argument('--label', default='local')
    args = parser.parse_args()
    evidence = ROOT / 'quality' / '20261003' / args.label
    evidence.mkdir(parents=True, exist_ok=True)
    report = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=chrome_bin(), headless=True)
        for slug in args.slugs:
            for width, height in [(1440, 1000), (390, 844), (768, 1024)]:
                page = await browser.new_page(viewport={'width': width, 'height': height}, reduced_motion='reduce')
                errors = []
                bad_http = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.on('response', lambda r: bad_http.append({'url':r.url,'status':r.status}) if r.status >= 400 and r.url.startswith(args.base) else None)
                response = await page.goto(args.base.rstrip('/') + '/works/' + slug + '/', wait_until='networkidle')
                await page.evaluate('document.fonts.ready')
                await page.evaluate("document.querySelectorAll('img').forEach(i=>i.loading='eager')")
                await page.wait_for_function('Array.from(document.images).every(i=>i.complete)', timeout=20000)
                state = await page.evaluate('''() => ({
                    title:document.title,
                    robots:document.querySelector('meta[name="robots"]')?.content||'',
                    overflow:document.documentElement.scrollWidth > innerWidth + 1,
                    brokenImages:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src),
                    headings:[...document.querySelectorAll('h1')].map(e=>e.textContent.trim()),
                    emptyControls:[...document.querySelectorAll('button,a')].filter(e=>!e.textContent.trim()&&!e.getAttribute('aria-label')&&!e.querySelector('img[alt]')).map(e=>e.outerHTML.slice(0,200)),
                    externalFormActions:[...document.forms].map(f=>f.getAttribute('action')).filter(a=>a&&a!=='#'),
                    sampleNotice:/架空|制作例|自主制作/.test(document.body.innerText)
                })''')
                state.update(slug=slug, width=width, status=response.status, errors=errors, badHttp=bad_http)
                report.append(state)
                if args.capture:
                    await page.screenshot(path=str(evidence / f'{slug}-{width}.png'), full_page=True)
                    if width == 1440:
                        preview = evidence / f'{slug}-hero.png'
                        await page.screenshot(path=str(preview))
                        Image.open(preview).save(ROOT/'works'/slug/'thumbnail.webp', 'WEBP', quality=86)
                print(json.dumps(state, ensure_ascii=False), flush=True)
                await page.close()
        await browser.close()
    (evidence/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    failed = [r for r in report if r['status'] != 200 or r['overflow'] or r['brokenImages'] or r['errors'] or r['badHttp'] or not r['sampleNotice'] or 'noindex' not in r['robots'] or len(r['headings']) != 1 or r['externalFormActions']]
    if failed:
        raise SystemExit(f'{len(failed)} failed checks; see {evidence}/report.json')


if __name__ == '__main__':
    asyncio.run(main())
