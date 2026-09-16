"""Validate the thumbnail inventory across the three catalogue pages."""
import hashlib, json, subprocess, sys
from pathlib import Path
from bs4 import BeautifulSoup
root = Path.cwd()
soup = BeautifulSoup(''.join((root / f).read_text() for f in ['cw.html','cw-web.html','cw-social.html']), 'html.parser')
images = [root / a.img['src'].split('?')[0].removeprefix('./') for a in soup.select('.work-card')]
assert len(images) == 32
assert len({hashlib.sha256(p.read_bytes()).hexdigest() for p in images}) == 32
assert len(soup.select('.work-card img[src^="./pf/real-covers/"]')) == 22
assert len(soup.select('#web .work-card')) == 10
manifest = json.loads((root/'pf/real-covers/manifest.json').read_text())
assert len(manifest) == 32
assert len({tuple(x['palette']) for x in manifest}) == 32
subprocess.run([sys.executable, 'pf/verify_catalog_routes.py'], check=True)
