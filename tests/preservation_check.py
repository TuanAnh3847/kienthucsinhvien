"""Compare locked data with a baseline while allowing editorial prose changes."""
from pathlib import Path
from collections import Counter
import subprocess
import json
import re
import sys
sys.path.insert(0, str(Path(__file__).parent / '.python'))
import html5lib

root = Path(__file__).resolve().parent.parent
baseline = sys.argv[1] if len(sys.argv) > 1 else 'main'
routes = json.loads((root / 'firebase.json').read_text())['hosting']['rewrites']
old_config = json.loads(subprocess.check_output(['git', 'show', f'{baseline}:firebase.json'], cwd=root))
assert routes == old_config['hosting']['rewrites'], 'Short routes changed'
ns = '{http://www.w3.org/1999/xhtml}'

def read_tree(source):
    return html5lib.parse(source)

def snapshot(tree):
    chapters, fields, answers, tables, math, hero = [], [], [], [], [], []
    for el in tree.iter():
        tag = el.tag.replace(ns, '') if isinstance(el.tag, str) else ''
        attrs = el.attrib
        classes = attrs.get('class', '').split()
        text = re.sub(r'\s+', ' ', ''.join(el.itertext())).strip()
        if 'tab-content' in classes:
            chapters.append(attrs.get('id'))
        if tag in ('input', 'option'):
            fields.append((tag, tuple((k, attrs.get(k)) for k in ('id', 'name', 'type', 'value', 'min', 'max', 'step', 'disabled', 'selected'))))
        data = tuple(sorted((k, v) for k, v in attrs.items() if k.startswith('data-')))
        if data:
            answers.append((tag, data))
        if tag in ('td', 'th'):
            tables.append(re.findall(r'\d+(?:[.,:/–−-]\d+)*%?', text))
        if tag == 'h1':
            hero.append(text)
        if set(classes) & {'formula-line', 'big-formula', 'formula', 'formula-text'}:
            # The warning suffix is presentation, not part of the expression.
            math.append(text.replace('[dữ liệu trích xuất]', '').replace('[cần làm rõ số mũ]', '').strip())
    return {'chapters': chapters, 'form field constraints and option values': fields,
            'answer and dataset attributes': answers, 'table numeric cells': tables,
            'formula expressions': math, 'hero titles': hero}

for route in routes:
    file = route['destination'].lstrip('/')
    old = subprocess.check_output(['git', 'show', f'{baseline}:{file}'], cwd=root).decode('utf-8')
    current = (root / file).read_text(encoding='utf-8')
    before, after = snapshot(read_tree(old)), snapshot(read_tree(current))
    for key in before:
        assert before[key] == after[key], f'{file}: changed {key}'
    print(f'PASS {route["source"]}: locked chapters, titles, numeric tables, formulas, fields, answer/data attributes')

def homepage_cards(source):
    return [re.sub(r'\s+', ' ', ''.join(el.itertext())).strip()
            for el in read_tree(source).iter()
            if 'course-card' in el.attrib.get('class', '').split()]
old_home = subprocess.check_output(['git', 'show', f'{baseline}:index.html'], cwd=root).decode('utf-8')
assert homepage_cards(old_home) == homepage_cards((root / 'index.html').read_text(encoding='utf-8')), 'Homepage card text changed'
print('PASS homepage card text and Firebase short routes unchanged')
