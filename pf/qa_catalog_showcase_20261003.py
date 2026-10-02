"""Catalogue regression for the 2026-10-03 nine-study rebuild.

Checks current CW-safe routing, not the obsolete historical mail/LINE assertions.
Does not send forms or contact any customer.
"""
import argparse
import asyncio
import hashlib
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / 'sidegig_crowdworks'))
from automation.chrome_bin import chrome_bin


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', default='http://127.0.0.1:8765')
    parser.add_argument('--label', default='catalog-local')
    args = parser.parse_args()
    base = args.base.rstrip('/') + '/'
    evidence = ROOT / 'quality' / '20261003' / args.label
    evidence.mkdir(parents=True, exist_ok=True)
    result = {'widths': [], 'filters': {}, 'new_work_count': 9, 'preserved_old_work_count': 10}
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=chrome_bin(), headless=True)
        page = await browser.new_page(viewport={'width':1440,'height':1000}, reduced_motion='reduce')
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        response = await page.goto(base+'cw-web.html', wait_until='networkidle')
        assert response.status == 200
        assert await page.locator('#new-works .work').count() == 9
        assert await page.locator('#earlier-works > a').count() == 10
        await page.evaluate("document.querySelectorAll('img').forEach(i=>i.loading='eager')")
        await page.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)')
        hrefs = await page.locator('#new-works .work-image').evaluate_all('els=>els.map(e=>e.getAttribute("href"))')
        assert len(set(hrefs)) == 9
        hashes = [hashlib.sha256((ROOT/href/'thumbnail.webp').read_bytes()).hexdigest() for href in hrefs]
        assert len(set(hashes)) == 9
        result['distinct_thumbnails'] = True
        expected = {'cw-corp.html','cw-lp-gym.html','cw-studio-yohaku.html',
                    'custom/cw-vintage-archive-inbound.html','cw-lp-recruit.html',
                    'cw-stay-naginoma.html','cw-dental-sakura.html','cw-relay.html',
                    'cw-salon.html','cw-pixel-office.html'}
        actual = set(await page.locator('#earlier-works > a').evaluate_all('els=>els.map(e=>e.getAttribute("href"))'))
        assert actual == expected
        assert await page.locator('.category-nav a').evaluate_all('els=>els.every(e=>!e.target)')
        assert await page.locator('.work-image,#earlier-works>a').evaluate_all('els=>els.every(e=>e.target==="_blank"&&e.rel.includes("noopener"))')
        for width in [1440, 768, 390, 320]:
            await page.set_viewport_size({'width':width,'height':1000 if width>650 else 844})
            await page.evaluate('scrollTo(0,0)')
            await page.screenshot(path=str(evidence/f'catalog-{width}.png'),full_page=True)
            overflow = await page.evaluate('document.documentElement.scrollWidth-innerWidth')
            assert overflow <= 1, (width,overflow)
            result['widths'].append({'width':width,'overflow':overflow})
        # Reduced-motion must not hide a layout defect in the decorative canvas.
        await page.emulate_media(reduced_motion='no-preference')
        await page.wait_for_selector('#cursor-field', state='attached')
        cursor = await page.locator('#cursor-field').evaluate('e=>({position:getComputedStyle(e).position,pointerEvents:getComputedStyle(e).pointerEvents})')
        assert cursor == {'position':'fixed','pointerEvents':'none'}, cursor
        footer_gap = await page.evaluate('document.body.getBoundingClientRect().bottom-document.querySelector("footer").getBoundingClientRect().bottom')
        assert footer_gap <= 1, footer_gap
        result['normal_motion_cursor_overlay'] = {'style':cursor,'extra_footer_height':footer_gap}
        await page.emulate_media(reduced_motion='reduce')
        for key,count in [('all',9),('company',6),('booking',6),('recruit',1),('product',1)]:
            await page.locator(f'[data-filter={key}]').click()
            actual = await page.locator('#new-works .work:visible').count()
            assert actual == count, (key,actual,count)
            result['filters'][key]=actual
        await page.locator('[data-filter=all]').click()
        await page.locator('#work-search').fill('大人')
        assert await page.locator('#new-works .work:visible').count() == 1
        await page.locator('#work-search').fill('検索に存在しない語')
        assert await page.locator('#empty-state').is_visible()
        await page.locator('#reset-search').click()
        assert await page.locator('#new-works .work:visible').count() == 9
        result['search_empty_reset'] = True
        for href in hrefs:
            async with page.expect_popup() as info:
                await page.locator(f'.work-image[href="{href}"]').click()
            popup = await info.value
            await popup.wait_for_url('**/works/**')
            await popup.wait_for_load_state('domcontentloaded')
            assert '/works/' in popup.url
            assert await popup.locator('h1').count() == 1
            await popup.close()
        result['all_nine_open_in_new_tab'] = True
        await page.locator('.category-nav a[href="cw-social.html"]').click()
        assert len(page.context.pages)==1
        await page.goto(base+'cw.html#web')
        await page.wait_for_url('**/cw-web.html')
        assert len(page.context.pages)==1
        result['same_tab_category_and_legacy_route'] = True
        assert not errors, errors
        result['javascript_errors'] = errors
        await browser.close()
    (evidence/'report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    asyncio.run(main())
