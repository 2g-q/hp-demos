"""Build an explicit, reproducible publication manifest, without publishing.

The existing checkout contains local reference screenshots and unused originals.
Only explicitly selected source modules and assets referenced by them are shipped.
"""
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SLUGS = ['nagi-stay', 'towa-corporate', 'kajitsu', 'yohaku-architecture',
         'craft-recruit', 'linen-salon', 'axis-fitness', 'ember-restaurant', 'koto-learning']
modules = ['index.html', 'style.css', 'script.js', 'site.js', 'pass2.css',
           'pass2.js', 'editorial.css', 'editorial.js']
selected = {ROOT / p for p in ['cw-web.html', 'assets/web-showcase.css', 'assets/web-showcase.js', '.gitignore']}
missing = []
for slug in SLUGS:
    directory = ROOT / 'works' / slug
    source_files = [directory / name for name in modules if (directory / name).is_file()]
    selected.update(source_files)
    for name in ['thumbnail.webp', 'photo-sources.json', 'PROVENANCE.md']:
        if (directory / name).is_file():
            selected.add(directory / name)
    for source in source_files:
        content = source.read_text()
        if "'assets/'+t.photo+'.webp'" in content:
            for basename in re.findall(r"photo:'([a-z-]+)'", content):
                dynamic_asset = directory / 'assets' / (basename + '.webp')
                if dynamic_asset.is_file():
                    selected.add(dynamic_asset)
                else:
                    missing.append({'file': str(source.relative_to(ROOT)), 'reference': str(dynamic_asset.relative_to(directory))})
        # All current photo references use local quoted paths in HTML/CSS/JS.
        for match in re.finditer(r'''["'(]([^"'()\s<>]+\.(?:webp|jpg|jpeg|png|svg))(?:[?#][^"'()\s<>]*)?["')]''', content):
            reference = match.group(1)
            if urlsplit(reference).scheme or reference.startswith('/'):
                continue
            asset = (source.parent / reference).resolve()
            if not asset.is_file() and source.suffix == '.js' and '/' not in reference and "'assets/'+" in content:
                # Editorial scripts keep basenames in data and explicitly prefix assets/.
                asset = (source.parent / 'assets' / reference).resolve()
            if asset.is_file():
                if asset.is_relative_to(directory):
                    selected.add(asset)
            else:
                missing.append({'file': str(source.relative_to(ROOT)), 'reference': reference})

manifest = [{'path': str(p.relative_to(ROOT)), 'bytes': p.stat().st_size,
             'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(selected)]
destination = ROOT / 'quality' / '20261003' / 'release-manifest.json'
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps({'files': manifest, 'missing': missing}, ensure_ascii=False, indent=2))
print(json.dumps({'files': len(manifest), 'bytes': sum(p['bytes'] for p in manifest),
                  'missing': missing, 'manifest': str(destination)}, ensure_ascii=False))
if missing:
    raise SystemExit(1)
