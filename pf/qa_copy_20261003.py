"""Extract public Japanese copy (not code) and run the skill's declared uv environment."""
import json
import subprocess
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'quality'/'20261003'/'copy'
OUT.mkdir(parents=True,exist_ok=True)
LINT = Path.home()/'.codex/skills/natural-japanese/scripts/lint.py'
results = {}
for path in sorted((ROOT/'works').glob('*/index.html')):
    soup = BeautifulSoup(path.read_text(),'html.parser')
    lines = []
    for item in soup.select('h1,h2,h3,p,legend,summary'):
        if item.find_parent(['script','style']) or item.get('aria-hidden')=='true':
            continue
        text = item.get_text('',strip=True)
        if text:
            lines.append(('# ' if item.name.startswith('h') else '')+text)
    text_file = OUT/(path.parent.name+'.txt')
    text_file.write_text('\n\n'.join(lines))
    proc = subprocess.run(['uv','run',str(LINT),str(text_file),'--json'],capture_output=True,text=True)
    if proc.returncode:
        raise RuntimeError(path.parent.name+': '+proc.stderr)
    data = json.loads(proc.stdout)
    (OUT/(path.parent.name+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2))
    results[path.parent.name] = data
    print(path.parent.name, json.dumps(data,ensure_ascii=False),flush=True)
(OUT/'all-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
