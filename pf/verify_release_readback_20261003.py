"""Read-only byte comparison of the published nine-study release."""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--base', default='https://2g-q.github.io/hp-demos/')
parser.add_argument('--revision', required=True)
args = parser.parse_args()
manifest = json.loads((ROOT/'quality/20261003/release-manifest.json').read_text())
files = [row for row in manifest['files'] if row['path'] != '.gitignore']

def compare(row):
    url = args.base.rstrip('/') + '/' + row['path'] + '?rev=' + args.revision
    result = {'path': row['path'], 'url': url, 'expectedSha256': row['sha256']}
    try:
        with urlopen(Request(url, headers={'User-Agent':'Minato-Portfolio-Release-Verification'}), timeout=40) as response:
            content = response.read()
            result.update(status=response.status, bytes=len(content), sha256=hashlib.sha256(content).hexdigest())
            result['matches'] = result['sha256'] == row['sha256']
    except Exception as error:
        result.update(matches=False, error=str(error))
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
    results = list(executor.map(compare, files))
report = {'revision':args.revision, 'base':args.base, 'files':results,
          'matched':sum(row['matches'] for row in results), 'total':len(results)}
destination = ROOT/'quality/20261003/published-readback.json'
destination.write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps({key:value for key,value in report.items() if key != 'files'}, ensure_ascii=False))
failed = [row for row in results if not row['matches']]
if failed:
    print(json.dumps(failed, ensure_ascii=False, indent=2))
    raise SystemExit(1)
